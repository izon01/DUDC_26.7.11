import { useEffect, useMemo, useRef, useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import "ckeditor5/ckeditor5.css";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { ClassicEditor, createCkeditorConfig } from "../ckeditorConfig";
import { highlightHtml, highlightText } from "../searchHighlight";

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, " ");
}

async function parseJsonSafely(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function pageSearchText(page) {
  if (!page) return "";
  return [page.heading, stripHtml(page.html || "")].filter(Boolean).join(" ");
}

function manualSearchText(manual) {
  return [manual.title, ...manual.spreads.flatMap((s) => [pageSearchText(s.left), pageSearchText(s.right)])]
    .join(" ")
    .toLowerCase();
}

function BookPage({ page, searchTerm }) {
  const hasContent = Boolean(page.heading?.trim() || stripHtml(page.html || "").trim());
  return (
    <div className="w-full min-h-full px-14 pt-6 pb-16 relative break-keep">
      <div className="space-y-8">
        <h2 className="text-center text-headline-lg font-bold text-on-surface pb-6 border-b-2 border-primary/10">
          {highlightText(page.heading || "제목 없음", searchTerm)}
        </h2>
        {hasContent ? (
          <div
            className="ck-content !text-[18px] !leading-[1.9] break-keep text-on-surface-variant"
            dangerouslySetInnerHTML={{ __html: highlightHtml(page.html, searchTerm) }}
          />
        ) : (
          <p className="text-center text-body-lg text-outline">아직 작성된 내용이 없습니다.</p>
        )}
      </div>
      <div className="absolute bottom-8 left-0 w-full text-center text-body-md text-outline">
        — {page.pageNum} —
      </div>
    </div>
  );
}

// In-place page editor — mirrors BookPage's size/padding/typography exactly
// (same px-14/pt-6/pb-16 page box, same heading classes) so flipping between
// read and edit mode never changes the book's apparent size or font ratio.
function BookPageEditor({ heading, html, pageNum, ckeditorConfig, onHeadingChange, onHtmlChange, editorKey }) {
  return (
    <div className="w-full h-full min-h-full px-14 pt-6 pb-16 relative break-keep flex flex-col">
      <input
        type="text"
        value={heading}
        onChange={(e) => onHeadingChange(e.target.value)}
        placeholder="제목을 입력하세요"
        className="w-full text-center text-headline-lg font-bold text-on-surface bg-transparent outline-none placeholder:text-outline/40 pb-6 mb-8 border-b-2 border-primary/10 focus:border-primary/40 transition-colors shrink-0"
      />
      <div className="flex-1 min-h-0">
        <div className="dudc-ckeditor dudc-ckeditor-lg h-full">
          <CKEditor
            key={editorKey}
            editor={ClassicEditor}
            data={html}
            config={ckeditorConfig}
            onChange={(_event, editor) => onHtmlChange(editor.getData())}
          />
        </div>
      </div>
      <div className="absolute bottom-8 left-0 w-full text-center text-body-md text-outline pointer-events-none">
        — {pageNum} —
      </div>
    </div>
  );
}

export default function WorkManual() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin";

  const [manuals, setManuals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedManualId, setSelectedManualId] = useState(null);
  const [spreadIndex, setSpreadIndex] = useState(0);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editSessionKey, setEditSessionKey] = useState(0);
  const editSnapshotRef = useRef(null);
  const [ckeditorConfig] = useState(() => createCkeditorConfig("본문을 작성해보세요."));

  useEffect(() => {
    let cancelled = false;

    async function loadManuals() {
      try {
        const res = await fetch("/api/work-manuals");
        const data = await parseJsonSafely(res);
        if (!res.ok) throw new Error(data.message || "매뉴얼을 불러오지 못했습니다.");
        if (cancelled) return;
        setManuals(data.manuals);
        if (data.manuals.length > 0) setSelectedManualId(data.manuals[0].id);
      } catch (error) {
        if (!cancelled) setLoadError(error.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadManuals();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredManuals = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return manuals;
    return manuals.filter((m) => manualSearchText(m).includes(term));
  }, [manuals, searchTerm]);

  const selectedManual = manuals.find((m) => m.id === selectedManualId) ?? null;
  const currentSpread = selectedManual ? selectedManual.spreads[spreadIndex] ?? selectedManual.spreads[0] : null;
  const totalPages = selectedManual ? selectedManual.spreads.length * 2 : 0;
  const progressPercent = totalPages ? Math.round(((spreadIndex + 1) * 2 * 100) / totalPages) : 0;

  function handleSelectManual(id) {
    if (isEditMode) return;
    setSelectedManualId(id);
    setSpreadIndex(0);
  }

  function goPrev() {
    setSpreadIndex((idx) => Math.max(0, idx - 1));
  }

  function goNext() {
    if (!selectedManual) return;
    const target = spreadIndex + 1;
    if (target >= selectedManual.spreads.length) {
      if (!isEditMode) return;
      // In edit mode, paging past the last spread extends the manual with a
      // fresh blank spread so the next two pages can be written immediately.
      const nextPageNum = selectedManual.spreads.length * 2 + 1;
      setManuals((prev) =>
        prev.map((manual) =>
          manual.id !== selectedManualId
            ? manual
            : {
                ...manual,
                spreads: [
                  ...manual.spreads,
                  {
                    left: { heading: "", html: "", pageNum: nextPageNum },
                    right: { heading: "", html: "", pageNum: nextPageNum + 1 },
                  },
                ],
              }
        )
      );
      setSpreadIndex(target);
      return;
    }
    setSpreadIndex(target);
  }

  function beginCreate() {
    editSnapshotRef.current = { manuals, selectedManualId, spreadIndex };
    const draftId = `draft-${Date.now()}`;
    const newManual = {
      id: draftId,
      title: "",
      spreads: [
        {
          left: { heading: "", html: "", pageNum: 1 },
          right: { heading: "", html: "", pageNum: 2 },
        },
      ],
    };
    setManuals((prev) => [...prev, newManual]);
    setSelectedManualId(draftId);
    setSpreadIndex(0);
    setEditSessionKey((k) => k + 1);
    setIsEditMode(true);
  }

  function beginEdit() {
    editSnapshotRef.current = { manuals, selectedManualId, spreadIndex };
    setEditSessionKey((k) => k + 1);
    setIsEditMode(true);
  }

  function cancelEdit() {
    const snapshot = editSnapshotRef.current;
    if (snapshot) {
      setManuals(snapshot.manuals);
      setSelectedManualId(snapshot.selectedManualId);
      setSpreadIndex(snapshot.spreadIndex);
    }
    editSnapshotRef.current = null;
    setIsEditMode(false);
  }

  async function finishEdit() {
    if (!selectedManual.title.trim()) {
      window.alert("매뉴얼 제목을 입력해주세요.");
      return;
    }

    const isDraft = selectedManualId.startsWith("draft-");
    setIsSaving(true);
    try {
      if (isDraft) {
        const res = await fetch("/api/work-manuals", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title: selectedManual.title, spreads: selectedManual.spreads }),
        });
        const data = await parseJsonSafely(res);
        if (!res.ok) throw new Error(data.message || "매뉴얼 생성에 실패했습니다.");
        setManuals((prev) => prev.map((manual) => (manual.id === selectedManualId ? data.manual : manual)));
        setSelectedManualId(data.manual.id);
      } else {
        const res = await fetch(`/api/work-manuals?id=${selectedManualId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title: selectedManual.title, spreads: selectedManual.spreads }),
        });
        const data = await parseJsonSafely(res);
        if (!res.ok) throw new Error(data.message || "매뉴얼 수정에 실패했습니다.");
        setManuals((prev) => prev.map((manual) => (manual.id === selectedManualId ? data.manual : manual)));
      }
      editSnapshotRef.current = null;
      setIsEditMode(false);
    } catch (error) {
      window.alert(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteManual() {
    if (manuals.length <= 1) {
      window.alert("최소 1개의 매뉴얼은 남아 있어야 합니다.");
      return;
    }
    if (!window.confirm("정말 이 매뉴얼을 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.")) return;

    try {
      const res = await fetch(`/api/work-manuals?id=${selectedManualId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseJsonSafely(res);
      if (!res.ok) throw new Error(data.message || "매뉴얼 삭제에 실패했습니다.");

      const remaining = manuals.filter((m) => m.id !== selectedManualId);
      setManuals(remaining);
      setSelectedManualId(remaining[0].id);
      setSpreadIndex(0);
    } catch (error) {
      window.alert(error.message);
    }
  }

  function updateManualTitle(value) {
    setManuals((prev) => prev.map((manual) => (manual.id === selectedManualId ? { ...manual, title: value } : manual)));
  }

  function updatePageField(side, field, value) {
    setManuals((prev) =>
      prev.map((manual) => {
        if (manual.id !== selectedManualId) return manual;
        const updatedSpreads = manual.spreads.map((spread, idx) =>
          idx !== spreadIndex ? spread : { ...spread, [side]: { ...spread[side], [field]: value } }
        );
        return { ...manual, spreads: updatedSpreads };
      })
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden font-body-md text-on-surface">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 border-r border-dashed border-outline-variant bg-surface-container-low flex flex-col">
          <div className="p-6 border-b border-dashed border-outline-variant">
            <h2 className="font-headline-md text-[18px] font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">menu_book</span>
              업무 매뉴얼 리스트
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1">
            {isAdmin && (
              <button
                onClick={beginCreate}
                disabled={isEditMode}
                className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">add_circle</span>
                신규 매뉴얼 등록
              </button>
            )}

            <div className="mb-6 px-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">search</span>
                <span className="text-label-sm font-label-sm text-secondary">매뉴얼 검색</span>
              </div>
              <div className="relative flex items-center">
                <input
                  className="w-full bg-surface-container-lowest border border-dashed border-outline-variant rounded-lg focus:border-primary focus:ring-0 text-sm pl-3 pr-10 py-2 transition-all"
                  placeholder="제목, 본문 내용으로 검색..."
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="absolute right-2 flex items-center justify-center w-8 h-8 bg-primary text-on-primary rounded-md">
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </span>
              </div>
            </div>

            {!isLoading && filteredManuals.length === 0 && (
              <p className="px-2 py-6 text-center text-label-sm text-on-surface-variant">
                {manuals.length === 0 ? "등록된 매뉴얼이 없습니다." : "검색 결과가 없습니다."}
              </p>
            )}

            {filteredManuals.map((manual) => (
              <button
                key={manual.id}
                onClick={() => handleSelectManual(manual.id)}
                disabled={isEditMode}
                className={
                  manual.id === selectedManualId
                    ? "w-full text-left p-3 rounded-xl bg-primary text-on-primary font-bold transition-all shadow-sm disabled:cursor-not-allowed"
                    : "w-full text-left p-3 rounded-xl hover:bg-surface-container-highest text-on-surface-variant transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                }
              >
                {highlightText(manual.title || "(제목 없음)", searchTerm)}
              </button>
            ))}
          </div>
        </aside>

        {/* Main Stage */}
        <main className="flex-1 flex flex-col relative bg-[#f1f4f9] overflow-hidden">
          {isAdmin && isEditMode && (
            <input
              type="text"
              value={selectedManual.title}
              onChange={(e) => updateManualTitle(e.target.value)}
              placeholder="매뉴얼 제목을 입력하세요"
              className="absolute top-6 left-1/2 -translate-x-1/2 z-20 w-[360px] px-4 py-2 rounded-full border-2 border-dashed border-primary/30 bg-white text-center font-bold text-on-surface focus:border-primary focus:ring-0 outline-none transition-colors"
            />
          )}

          {isAdmin && selectedManual && (
            <div className="absolute top-6 right-8 z-20 flex items-center gap-3">
              {isEditMode ? (
                <>
                  <button
                    onClick={cancelEdit}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-dashed border-outline-variant text-on-surface-variant font-bold hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    취소
                  </button>
                  <button
                    onClick={finishEdit}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-full font-bold hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "저장 중..." : "저장"}
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={beginEdit}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-full font-bold hover:opacity-90 active:scale-95 transition-all shadow-md"
                  >
                    <span className="material-symbols-outlined">edit</span>
                    <span className="text-body-md">수정</span>
                  </button>
                  <button
                    onClick={handleDeleteManual}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-red-600 text-red-600 font-bold bg-white hover:bg-red-50 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined">delete</span>
                    <span className="text-body-md">삭제</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
            {isLoading ? (
              <p className="text-on-surface-variant">불러오는 중...</p>
            ) : loadError ? (
              <p className="text-error">{loadError}</p>
            ) : !selectedManual ? (
              <div className="text-center text-on-surface-variant">
                <p className="mb-2">등록된 매뉴얼이 없습니다.</p>
                {isAdmin && <p className="text-[13px]">좌측의 '신규 매뉴얼 등록' 버튼으로 첫 매뉴얼을 작성해보세요.</p>}
              </div>
            ) : (
              <>
                <button
                  onClick={goPrev}
                  disabled={spreadIndex === 0}
                  className="absolute left-6 w-12 h-12 rounded-full border border-dashed border-primary text-primary flex items-center justify-center hover:bg-primary-fixed bg-surface-container-lowest/50 backdrop-blur-sm transition-colors z-30 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[32px]">chevron_left</span>
                </button>
                <button
                  onClick={goNext}
                  disabled={!isEditMode && spreadIndex === selectedManual.spreads.length - 1}
                  className="absolute right-6 w-12 h-12 rounded-full border border-dashed border-primary text-primary flex items-center justify-center hover:bg-primary-fixed bg-surface-container-lowest/50 backdrop-blur-sm transition-colors z-30 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[32px]">chevron_right</span>
                </button>

                <div className="relative max-w-[1400px] w-full h-full max-h-[820px]">
                  <div className="absolute -left-2 top-2 bottom-2 w-4 bg-surface-container-highest rounded-l-lg shadow-sm z-0" />
                  <div className="absolute -left-1 top-1 bottom-1 w-4 bg-surface-container-high rounded-l-lg shadow-sm z-0" />
                  <div className="absolute -right-2 top-2 bottom-2 w-4 bg-surface-container-highest rounded-r-lg shadow-sm z-0" />
                  <div className="absolute -right-1 top-1 bottom-1 w-4 bg-surface-container-high rounded-r-lg shadow-sm z-0" />

                  <div className="relative z-10 shadow-2xl rounded-lg overflow-hidden flex bg-surface-container-lowest h-full">
                    <div className="absolute left-1/2 top-0 bottom-0 w-8 -ml-4 bg-gradient-to-r from-black/5 via-black/10 to-black/5 z-20 pointer-events-none border-x border-outline-variant/10" />
                    <div className="w-1/2 border-r border-outline-variant/20 relative overflow-y-auto custom-scrollbar">
                      {isEditMode ? (
                        <BookPageEditor
                          editorKey={`${selectedManualId}-${spreadIndex}-left-${editSessionKey}`}
                          heading={currentSpread.left.heading}
                          html={currentSpread.left.html}
                          pageNum={currentSpread.left.pageNum}
                          ckeditorConfig={ckeditorConfig}
                          onHeadingChange={(v) => updatePageField("left", "heading", v)}
                          onHtmlChange={(v) => updatePageField("left", "html", v)}
                        />
                      ) : (
                        <BookPage page={currentSpread.left} searchTerm={searchTerm} />
                      )}
                    </div>
                    <div className="w-1/2 relative overflow-y-auto custom-scrollbar">
                      {isEditMode ? (
                        <BookPageEditor
                          editorKey={`${selectedManualId}-${spreadIndex}-right-${editSessionKey}`}
                          heading={currentSpread.right.heading}
                          html={currentSpread.right.html}
                          pageNum={currentSpread.right.pageNum}
                          ckeditorConfig={ckeditorConfig}
                          onHeadingChange={(v) => updatePageField("right", "heading", v)}
                          onHtmlChange={(v) => updatePageField("right", "html", v)}
                        />
                      ) : (
                        <BookPage page={currentSpread.right} searchTerm={searchTerm} />
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {selectedManual && (
            <div className="px-10 pb-8 flex flex-col items-center z-10">
              <div className="w-2/3 relative h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-primary transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="w-2/3 flex justify-between mt-2 text-label-sm text-outline">
                <span>시작</span>
                <span className="text-primary font-bold">
                  {(spreadIndex + 1) * 2} / {totalPages} 페이지
                </span>
                <span>완료</span>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
