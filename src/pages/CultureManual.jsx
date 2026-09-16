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
  const [selectedGuideId, setSelectedGuideId] = useState(
    () => getCache(CACHE_KEY)?.find((g) => g.type !== "label")?.id ?? null
  );
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
        const firstPage = data.posts.find((g) => g.type !== "label");
        if (firstPage) setSelectedGuideId(firstPage.id);
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

  // Culture posts don't have WorkManual's fixed 8 categories — labels are
  // free-form rows mixed into the same sort order, so a "chapter" here is
  // just a label followed by whatever pages sit before the next label. Pages
  // before the first label land in an unlabeled leading group.
  const groups = useMemo(() => {
    const list = [];
    let current = null;
    for (const guide of filteredGuides) {
      if (guide.type === "label") {
        current = { label: guide, pages: [] };
        list.push(current);
      } else {
        if (!current) {
          current = { label: null, pages: [] };
          list.push(current);
        }
        current.pages.push(guide);
      }
    }
    return list;
  }, [filteredGuides]);

  // Which label accordions are expanded — independent per label, mirroring
  // WorkManual's openChapterIds. Lazily seeded from the label that precedes
  // the cached initial selection so a cached reload doesn't flash collapsed.
  const [openLabelIds, setOpenLabelIds] = useState(() => {
    const cached = getCache(CACHE_KEY);
    const selected = cached?.find((g) => g.type !== "label")?.id;
    if (!cached || !selected) return new Set();
    let labelId = null;
    for (const g of cached) {
      if (g.type === "label") labelId = g.id;
      if (g.id === selected) break;
    }
    return labelId ? new Set([labelId]) : new Set();
  });
  const didAutoOpenRef = useRef(Boolean(getCache(CACHE_KEY)));

  // Same seeding as above, for the case a fresh fetch (no cache) determines
  // the initial selection asynchronously. Only ever runs once.
  useEffect(() => {
    if (isLoading || didAutoOpenRef.current) return;
    didAutoOpenRef.current = true;
    const idx = guides.findIndex((g) => g.id === selectedGuideId);
    if (idx === -1) return;
    let labelId = null;
    for (let i = idx; i >= 0; i--) {
      if (guides[i].type === "label") {
        labelId = guides[i].id;
        break;
      }
    }
    if (labelId) setOpenLabelIds(new Set([labelId]));
  }, [isLoading, guides, selectedGuideId]);

  function toggleLabel(labelId) {
    setOpenLabelIds((prev) => {
      const next = new Set(prev);
      if (next.has(labelId)) next.delete(labelId);
      else next.add(labelId);
      return next;
    });
  }

  const rawSelectedGuide = guides.find((g) => g.id === selectedGuideId) ?? null;
  const selectedGuide = rawSelectedGuide && rawSelectedGuide.type !== "label" ? rawSelectedGuide : null;

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
    if (guides.filter((g) => g.type !== "label").length <= 1) {
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
      setSelectedGuideId(remaining.find((g) => g.type !== "label")?.id ?? null);
    } catch (error) {
      window.alert(error.message);
    }
  }

  async function handleAddLabel() {
    const text = window.prompt("대제목 텍스트를 입력하세요 (예: 제1장 서무란 무엇인가)");
    if (!text || !text.trim()) return;

    try {
      const res = await fetch("/api/culture-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: "label", title: text.trim() }),
      });
      const data = await parseJsonSafely(res);
      if (!res.ok) throw new Error(data.message || "대제목 추가에 실패했습니다.");
      setGuides((prev) => [...prev, data.post]);
    } catch (error) {
      window.alert(error.message);
    }
  }

  async function handleEditLabel(id, currentTitle) {
    const text = window.prompt("대제목 텍스트를 수정하세요", currentTitle);
    if (!text || !text.trim() || text.trim() === currentTitle) return;

    try {
      const res = await fetch(`/api/culture-posts?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: "label", title: text.trim() }),
      });
      const data = await parseJsonSafely(res);
      if (!res.ok) throw new Error(data.message || "대제목 수정에 실패했습니다.");
      setGuides((prev) => prev.map((g) => (g.id === id ? data.post : g)));
    } catch (error) {
      window.alert(error.message);
    }
  }

  async function handleDeleteLabel(id, title) {
    if (!window.confirm(`"${title}" 대제목을 삭제하시겠습니까?`)) return;

    try {
      const res = await fetch(`/api/culture-posts?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseJsonSafely(res);
      if (!res.ok) throw new Error(data.message || "대제목 삭제에 실패했습니다.");
      setGuides((prev) => prev.filter((g) => g.id !== id));
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
            uploadToken={token}
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
            <div className="mb-3 shrink-0 space-y-2">
              <div className="flex gap-2">
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
              {!isReorderMode && (
                <button
                  onClick={handleAddLabel}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border-2 border-dashed border-outline-variant text-on-surface-variant font-bold text-[12px] hover:border-primary hover:text-primary transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">label</span>
                  대제목 추가
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

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isLoading && <SkeletonList count={4} itemClassName="h-16" />}
            {!isLoading && filteredGuides.length === 0 && (
              <p className="px-2 py-6 text-center text-[12px] text-on-surface-variant">
                {guides.length === 0 ? "등록된 포스트가 없습니다." : "검색 결과가 없습니다."}
              </p>
            )}
            {!isLoading && isReorderMode
              ? // Reorder mode: unchanged flat draggable list — labels and pages
                // are both draggable rows here so any order (including moving a
                // page across a label boundary) can be expressed by a single drag.
                filteredGuides.map((guide, idx) => {
                  if (guide.type === "label") {
                    return (
                      <div
                        key={guide.id}
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center gap-1 rounded-xl p-2 bg-white border border-outline-variant transition-opacity mb-3 ${
                          dragIndex === idx ? "opacity-40" : "opacity-100"
                        }`}
                      >
                        <span
                          className="material-symbols-outlined text-on-surface-variant cursor-grab active:cursor-grabbing shrink-0"
                          style={{ fontSize: "18px" }}
                        >
                          drag_indicator
                        </span>
                        <span className="flex-1 min-w-0 px-1 text-[13px] font-bold text-on-surface-variant tracking-wide truncate">
                          {highlightText(guide.title || "(제목 없음)", searchTerm)}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={guide.id}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-2 rounded-xl p-2 bg-white border border-outline-variant transition-opacity mb-3 ${
                        dragIndex === idx ? "opacity-40" : "opacity-100"
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-on-surface-variant cursor-grab active:cursor-grabbing shrink-0"
                        style={{ fontSize: "18px" }}
                      >
                        drag_indicator
                      </span>
                      <span className="flex-1 min-w-0 text-left p-2 text-sm text-on-surface-variant truncate">
                        {guide.title || "(제목 없음)"}
                      </span>
                    </div>
                  );
                })
              : // Normal mode: Notion-style hierarchy — bold label headers as
                // collapsible accordions, plain indented page rows underneath.
                groups.map((group, groupIdx) => {
                  if (!group.label) {
                    return (
                      <div key={`orphan-${groupIdx}`} className="space-y-0.5">
                        {group.pages.map((guide) => (
                          <button
                            key={guide.id}
                            onClick={() => selectGuide(guide.id)}
                            className={`block w-full text-left py-2 pl-4 -indent-4 pr-2.5 rounded-md text-sm leading-snug transition ${
                              guide.id === selectedGuideId
                                ? "bg-primary text-white font-bold"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {highlightText(guide.title, searchTerm)}
                          </button>
                        ))}
                      </div>
                    );
                  }

                  const isOpen = debouncedSearchTerm.trim() ? true : openLabelIds.has(group.label.id);
                  return (
                    <div key={group.label.id}>
                      <div
                        className={`flex items-center justify-between gap-2 px-1 pb-1.5 ${groupIdx === 0 ? "mt-1" : "mt-6"}`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleLabel(group.label.id)}
                          className="flex-1 min-w-0 flex items-center justify-between gap-2 text-left cursor-pointer hover:text-primary transition-colors"
                        >
                          <span className="text-sm font-bold text-gray-900 truncate">
                            {highlightText(group.label.title || "(제목 없음)", searchTerm)}
                          </span>
                          <span
                            className={`material-symbols-outlined text-gray-400 transition-transform duration-300 shrink-0 ${isOpen ? "rotate-90" : ""}`}
                            style={{ fontSize: "18px" }}
                          >
                            chevron_right
                          </span>
                        </button>
                        {isAdmin && (
                          <div className="shrink-0 flex items-center gap-0.5">
                            <button
                              onClick={() => handleEditLabel(group.label.id, group.label.title)}
                              title="대제목 수정"
                              className="w-5 h-5 flex items-center justify-center rounded-full text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                                edit
                              </span>
                            </button>
                            <button
                              onClick={() => handleDeleteLabel(group.label.id, group.label.title)}
                              title="대제목 삭제"
                              className="w-5 h-5 flex items-center justify-center rounded-full text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                                close
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                      <div
                        className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                      >
                        <div className="min-h-0 space-y-0.5">
                          {group.pages.map((guide) => (
                            <button
                              key={guide.id}
                              onClick={() => selectGuide(guide.id)}
                              className={`block w-full text-left py-2 pl-8 -indent-4 pr-2.5 rounded-md text-sm leading-snug font-normal transition ${
                                guide.id === selectedGuideId
                                  ? "bg-primary text-white font-bold"
                                  : "text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              {highlightText(guide.title, searchTerm)}
                            </button>
                          ))}
                        </div>
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
