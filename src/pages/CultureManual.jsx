import { useEffect, useMemo, useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import "ckeditor5/ckeditor5.css";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { ClassicEditor, createCkeditorConfig } from "../ckeditorConfig";
import { highlightHtml, highlightText } from "../searchHighlight";

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, " ");
}

function guideSearchText(guide) {
  const parts = [guide.title, stripHtml(guide.bodyHtml || ""), ...(guide.checkPoints || [])];
  return parts.filter(Boolean).join(" ").toLowerCase();
}

async function parseJsonSafely(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

// Full-width, single-column editor canvas (Naver-blog-style) that replaces the
// entire reading area while an admin creates or edits a culture post.
function CulturePostEditor({ mode, initialValues, isSaving, onCancel, onSave }) {
  const [title, setTitle] = useState(initialValues.title);
  const [bodyHtml, setBodyHtml] = useState(initialValues.bodyHtml);
  const [checkPointsText, setCheckPointsText] = useState(initialValues.checkPoints.join("\n"));
  const [ckeditorConfig] = useState(() => createCkeditorConfig("본문 내용을 자유롭게 작성해보세요."));

  function handleSubmit() {
    const trimmedTitle = title.trim();
    const isBodyEmpty = stripHtml(bodyHtml).trim().length === 0;
    if (!trimmedTitle || isBodyEmpty) return;

    const checkPoints = checkPointsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    onSave({ title: trimmedTitle, bodyHtml, checkPoints });
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-surface-container-lowest">
      <div className="h-16 bg-white stitch-border-b px-10 flex items-center justify-between gap-6">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="material-symbols-outlined text-primary shrink-0">
            {mode === "edit" ? "edit_note" : "post_add"}
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="포스트 제목을 입력하세요"
            className="w-full text-[20px] font-bold text-on-surface bg-transparent border-none outline-none focus:ring-0 placeholder:text-outline/40"
          />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-5 py-2 rounded-full border border-outline-variant text-on-surface-variant font-bold text-[13px] hover:bg-surface-container-low transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-5 py-2 rounded-full bg-primary text-white font-bold text-[13px] hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      <div className="max-w-5xl w-full mx-auto px-10 py-10">
        <div className="dudc-ckeditor dudc-ckeditor-sticky">
          <CKEditor
            editor={ClassicEditor}
            data={bodyHtml}
            config={ckeditorConfig}
            onChange={(_event, editor) => setBodyHtml(editor.getData())}
          />
        </div>

        <div className="mt-10">
          <label className="text-[14px] font-bold text-on-surface-variant mb-2 block" htmlFor="post-checkpoints">
            체크포인트 (한 줄에 하나씩)
          </label>
          <textarea
            id="post-checkpoints"
            value={checkPointsText}
            onChange={(e) => setCheckPointsText(e.target.value)}
            rows={5}
            placeholder={"예:\n출입구에서 동료를 만나면 밝게 인사하기\n엘리베이터 안에서는 조용히 대화하기"}
            className="w-full bg-white border border-outline-variant rounded-lg px-4 py-3 text-[14px] focus:border-primary focus:ring-0 transition-all resize-none"
          />
        </div>
      </div>
    </div>
  );
}

export default function CultureManual() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin";

  const [guides, setGuides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGuideId, setSelectedGuideId] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState("create");

  useEffect(() => {
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
    const term = searchTerm.trim().toLowerCase();
    if (!term) return guides;
    return guides.filter((g) => guideSearchText(g).includes(term));
  }, [guides, searchTerm]);

  const selectedGuide = guides.find((g) => g.id === selectedGuideId) ?? null;

  function selectGuide(id) {
    setSelectedGuideId(id);
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
              className="w-full bg-white border border-outline-variant rounded-lg pl-9 pr-3 py-2 text-sm focus:border-primary focus:ring-0 transition-all"
            />
          </div>

          {isAdmin && (
            <button
              onClick={openCreateEditor}
              className="w-full mb-4 shrink-0 flex items-center justify-center gap-2 px-3 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-[13px] hover:opacity-90 active:scale-95 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              신규 포스트 등록
            </button>
          )}

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
            {!isLoading && filteredGuides.length === 0 && (
              <p className="px-2 py-6 text-center text-[12px] text-on-surface-variant">
                {guides.length === 0 ? "등록된 포스트가 없습니다." : "검색 결과가 없습니다."}
              </p>
            )}
            {filteredGuides.map((guide, idx) => {
              const isActive = guide.id === selectedGuideId;
              return (
                <div
                  key={guide.id}
                  onClick={() => selectGuide(guide.id)}
                  className={
                    isActive
                      ? "p-4 bg-primary-container/10 border border-primary rounded-xl cursor-pointer"
                      : "p-4 bg-white border border-outline-variant rounded-xl cursor-pointer hover:border-primary transition-colors opacity-70"
                  }
                >
                  <p
                    className={
                      isActive
                        ? "text-[11px] text-primary font-bold mb-1 uppercase tracking-wider"
                        : "text-[11px] text-on-surface-variant font-bold mb-1 uppercase tracking-wider"
                    }
                  >
                    {`Guide ${String(idx + 1).padStart(2, "0")}`}
                  </p>
                  <h3 className="text-[15px] font-bold text-on-surface">{highlightText(guide.title, searchTerm)}</h3>
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
    </div>
  );
}
