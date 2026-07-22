import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import "ckeditor5/ckeditor5.css";
import Header from "../components/Header";
import Toast from "../components/Toast";
import { SkeletonList } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { highlightHtml, highlightText } from "../searchHighlight";
import { getCache, setCache } from "../utils/resourceCache";
import { stripHtml } from "../utils/html";
import { parseJsonSafely } from "../utils/http";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

const CACHE_KEY = "culture-posts";

// CKEditor (~1MB) only loads once an admin actually opens the editor, not for
// every visitor reading a post.
const CulturePostEditor = lazy(() => import("../components/CulturePostEditor"));

function guideSearchText(guide) {
  const parts = [guide.title, stripHtml(guide.bodyHtml || ""), ...(guide.checkPoints || [])];
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function EditorLoading() {
  return (
    <div className="flex-1 flex items-center justify-center bg-surface-container-lowest">
      <span className="material-symbols-outlined animate-spin text-primary text-[28px]">progress_activity</span>
    </div>
  );
}

export default function CultureManual() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin";

  const [guides, setGuidesState] = useState(() => getCache(CACHE_KEY) ?? []);
  const [isLoading, setIsLoading] = useState(() => !getCache(CACHE_KEY));
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 500);
  const [selectedGuideId, setSelectedGuideId] = useState(() => getCache(CACHE_KEY)?.[0]?.id ?? null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState("create");

  const setGuides = useCallback((updater) => {
    setGuidesState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      setCache(CACHE_KEY, next);
      return next;
    });
  }, []);

  const [isReorderMode, setIsReorderMode] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const originalGuidesRef = useRef(null);

  useEffect(() => {
    if (getCache(CACHE_KEY)) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadGuides() {
      try {
        const res = await fetch("/api/culture-posts");
        const data = await parseJsonSafely(res);
        if (!res.ok) throw new Error(data.message || "포스트를 불러오지 못했습니다.");
        if (cancelled) return;
        setGuides(data.posts);
        if (data.posts.length > 0) setSelectedGuideId(data.posts[0].id);
      } catch (error) {
        if (!cancelled) setLoadError(error.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadGuides();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredGuides = useMemo(() => {
    const term = debouncedSearchTerm.trim().toLowerCase();
    if (!term) return guides;
    return guides.filter((g) => guideSearchText(g).includes(term));
  }, [guides, debouncedSearchTerm]);

  const selectedGuide = guides.find((g) => g.id === selectedGuideId) ?? null;

  function selectGuide(id) {
    if (isReorderMode) return;
    setSelectedGuideId(id);
  }

  function enterReorderMode() {
    originalGuidesRef.current = guides;
    setSearchTerm("");
    setIsReorderMode(true);
  }

  function cancelReorder() {
    if (originalGuidesRef.current) setGuides(originalGuidesRef.current);
    originalGuidesRef.current = null;
    setDragIndex(null);
    setIsReorderMode(false);
  }

  function handleDragStart(index) {
    setDragIndex(index);
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setGuides((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(index);
  }

  function handleDragEnd() {
    setDragIndex(null);
  }

  async function saveOrderToDB() {
    setIsSavingOrder(true);
    try {
      const res = await fetch("/api/culture-posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ order: guides.map((g) => g.id) }),
      });
      const data = await parseJsonSafely(res);
      if (!res.ok) throw new Error(data.message || "순서 저장에 실패했습니다.");
      originalGuidesRef.current = null;
      setIsReorderMode(false);
      setToastMessage("순서가 저장되었습니다.");
    } catch (error) {
      window.alert(error.message);
    } finally {
      setIsSavingOrder(false);
    }
  }

  function openCreateEditor() {
    setEditorMode("create");
    setIsEditorOpen(true);
  }

  function openEditEditor() {
    setEditorMode("edit");
    setIsEditorOpen(true);
  }

  function closeEditor() {
    setIsEditorOpen(false);
  }

  async function handleSaveEditor({ title, bodyHtml, checkPoints }) {
    setIsSaving(true);
    try {
      if (editorMode === "create") {
        const res = await fetch("/api/culture-posts", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title, bodyHtml, checkPoints }),
        });
        const data = await parseJsonSafely(res);
        if (!res.ok) throw new Error(data.message || "포스트 등록에 실패했습니다.");
        setGuides((prev) => [...prev, data.post]);
        setSelectedGuideId(data.post.id);
      } else {
        const res = await fetch(`/api/culture-posts?id=${selectedGuideId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title, bodyHtml, checkPoints }),
        });
        const data = await parseJsonSafely(res);
        if (!res.ok) throw new Error(data.message || "포스트 수정에 실패했습니다.");
        setGuides((prev) => prev.map((guide) => (guide.id === selectedGuideId ? data.post : guide)));
      }
      setIsEditorOpen(false);
    } catch (error) {
      window.alert(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteGuide() {
    if (guides.length <= 1) {
      window.alert("최소 1개의 포스트는 남아 있어야 합니다.");
      return;
    }
    if (!window.confirm(`"${selectedGuide.title}" 포스트를 정말 삭제하시겠어요?`)) return;

    try {
      const res = await fetch(`/api/culture-posts?id=${selectedGuideId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseJsonSafely(res);
      if (!res.ok) throw new Error(data.message || "포스트 삭제에 실패했습니다.");

      const remaining = guides.filter((g) => g.id !== selectedGuideId);
      setGuides(remaining);
      setSelectedGuideId(remaining[0].id);
    } catch (error) {
      window.alert(error.message);
    }
  }

  if (isAdmin && isEditorOpen) {
    return (
      <div className="h-screen w-full flex flex-col bg-surface overflow-hidden">
        <Header />
        <Suspense fallback={<EditorLoading />}>
          <CulturePostEditor
            mode={editorMode}
            isSaving={isSaving}
            initialValues={
              editorMode === "edit"
                ? {
                    title: selectedGuide.title,
                    bodyHtml: selectedGuide.bodyHtml,
                    checkPoints: selectedGuide.checkPoints || [],
                  }
                : { title: "", bodyHtml: "", checkPoints: [] }
            }
            onCancel={closeEditor}
            onSave={handleSaveEditor}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-surface overflow-hidden">
      <Header />

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Narrow Left Sidebar */}
        <aside className="w-full md:w-[280px] max-h-[40vh] md:max-h-none bg-white border-b md:border-b-0 md:border-r border-outline-variant flex flex-col p-6 overflow-hidden shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-secondary">menu_book</span>
            <h2 className="font-bold text-[17px] text-on-surface">문화 포스트 목록</h2>
          </div>

          <div className="relative flex items-center mb-3 shrink-0">
            <span className="material-symbols-outlined absolute left-2.5 text-[18px] text-on-surface-variant pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="제목, 내용으로 검색..."
              disabled={isReorderMode}
              className="w-full bg-white border border-outline-variant rounded-lg pl-9 pr-3 py-2 text-sm focus:border-primary focus:ring-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>

          {isAdmin && (
            <div className="mb-3 shrink-0 flex gap-2">
              <button
                onClick={openCreateEditor}
                disabled={isReorderMode}
                className="flex-[8] flex items-center justify-center gap-2 px-3 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-[13px] hover:opacity-90 active:scale-95 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                신규 포스트 등록
              </button>
              {filteredGuides.length > 1 && !isReorderMode && (
                <button
                  onClick={enterReorderMode}
                  title="순서 변경"
                  className="flex-[2] flex items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">swap_vert</span>
                </button>
              )}
            </div>
          )}

          {isAdmin && isReorderMode && (
            <div className="mb-3 shrink-0 flex items-center justify-end gap-3">
              <button
                onClick={cancelReorder}
                disabled={isSavingOrder}
                className="text-on-surface-variant text-[12px] font-bold hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
              >
                취소
              </button>
              <button
                onClick={saveOrderToDB}
                disabled={isSavingOrder}
                className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-[12px] font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingOrder ? "저장 중..." : "저장"}
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
            {isLoading && <SkeletonList count={4} itemClassName="h-16" />}
            {!isLoading && filteredGuides.length === 0 && (
              <p className="px-2 py-6 text-center text-[12px] text-on-surface-variant">
                {guides.length === 0 ? "등록된 포스트가 없습니다." : "검색 결과가 없습니다."}
              </p>
            )}
            {!isLoading && filteredGuides.map((guide, idx) => {
              const isActive = guide.id === selectedGuideId;
              return (
                <div
                  key={guide.id}
                  draggable={isReorderMode}
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  onClick={() => selectGuide(guide.id)}
                  className={`flex items-center gap-2 rounded-xl transition-opacity ${
                    isReorderMode
                      ? `p-2 bg-white border border-outline-variant ${dragIndex === idx ? "opacity-40" : "opacity-100"}`
                      : isActive
                        ? "p-4 bg-primary-container/10 border border-primary cursor-pointer"
                        : "p-4 bg-white border border-outline-variant cursor-pointer hover:border-primary transition-colors opacity-70"
                  }`}
                >
                  {isReorderMode && (
                    <span
                      className="material-symbols-outlined text-on-surface-variant cursor-grab active:cursor-grabbing shrink-0"
                      style={{ fontSize: "18px" }}
                    >
                      drag_indicator
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className={
                        isActive
                          ? "text-[11px] text-primary font-bold mb-1 uppercase tracking-wider"
                          : "text-[11px] text-on-surface-variant font-bold mb-1 uppercase tracking-wider"
                      }
                    >
                      {`Guide ${String(idx + 1).padStart(2, "0")}`}
                    </p>
                    <h3 className="text-[15px] font-bold text-on-surface truncate">
                      {highlightText(guide.title, searchTerm)}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 p-4 bg-surface-container-low rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-[32px] text-secondary">pest_control_rodent</span>
            <div>
              <p className="text-[11px] text-on-surface-variant">궁금한 점이 있나요?</p>
              <p className="text-[13px] font-bold text-secondary">지식 베이스</p>
            </div>
          </div>
        </aside>

        {/* Single-column Reader Area */}
        <section className="flex-1 min-h-0 bg-surface-container-lowest relative flex items-center justify-center p-4 md:p-10 overflow-hidden">
          {isLoading ? (
            <p className="text-on-surface-variant">불러오는 중...</p>
          ) : loadError ? (
            <p className="text-error">{loadError}</p>
          ) : !selectedGuide ? (
            <div className="text-center text-on-surface-variant">
              <p className="mb-2">등록된 문화 포스트가 없습니다.</p>
              {isAdmin && <p className="text-[13px]">좌측의 '신규 포스트 등록' 버튼으로 첫 포스트를 작성해보세요.</p>}
            </div>
          ) : (
            <>
              <div className="w-full max-w-[900px] h-full bg-white book-page-shadow rounded-[2rem] border border-outline-variant flex flex-col overflow-hidden">
                {/* Page Header */}
                <div className="px-12 py-8 stitch-border-b flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="bg-primary-fixed text-on-primary-fixed-variant px-3 py-1 rounded-full text-[12px] font-bold shrink-0">
                      New Joiner Guide
                    </span>
                    <h2 className="text-[24px] font-bold text-on-surface truncate">
                      {highlightText(selectedGuide.title, searchTerm)}
                    </h2>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={openEditEditor}
                        title="수정"
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button
                        onClick={handleDeleteGuide}
                        title="삭제"
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-outline-variant text-on-surface-variant hover:border-error hover:text-error transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Page Content */}
                <div className="flex-1 px-12 py-10 overflow-y-auto custom-scrollbar">
                  <div className="max-w-2xl mx-auto space-y-10">
                    <div
                      className="ck-content !text-[16px] !leading-[1.8] break-keep text-on-surface-variant"
                      dangerouslySetInnerHTML={{ __html: highlightHtml(selectedGuide.bodyHtml, searchTerm) }}
                    />

                    {selectedGuide.checkPoints.length > 0 && (
                      <div className="p-8 bg-surface-container-low border border-outline-variant rounded-2xl">
                        <h4 className="font-bold text-[16px] text-on-surface mb-4">Check Points:</h4>
                        <ul className="space-y-4">
                          {selectedGuide.checkPoints.map((point) => (
                            <li key={point} className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-primary">check_circle</span>
                              <span className="text-[15px] text-on-surface-variant">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Floating Mascot */}
              <div className="absolute bottom-10 right-10 flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-primary shadow-lg animate-bounce">
                <p className="text-[13px] font-bold text-primary">정독 중이에요!</p>
                <span className="material-symbols-outlined text-primary text-[24px]">pest_control_rodent</span>
              </div>
            </>
          )}
        </section>
      </main>

      {toastMessage && <Toast message={toastMessage} onDone={() => setToastMessage("")} />}
    </div>
  );
}
