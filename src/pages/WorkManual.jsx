import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import "ckeditor5/ckeditor5.css";
import Header from "../components/Header";
import HeroBanner from "../components/HeroBanner";
import Toast from "../components/Toast";
import { SkeletonList } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { ClassicEditor, createCkeditorConfig } from "../ckeditorConfig";
import { highlightHtml, highlightText } from "../searchHighlight";
import { getCache, setCache } from "../utils/resourceCache";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

const CACHE_KEY = "work-manuals";

const BOOKSHELF_PARTS = [
  {
    id: "mindset",
    title: "마음가짐",
    subtitle: "신입사원이 가져야 할 기본 마인드셋, 공사의 미션·비전 등",
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    id: "organization",
    title: "조직·직무 이해",
    subtitle: "회사 업무 안내, 성과관리, 승진, 교육 등",
    gradient: "from-sky-400 to-cyan-600",
  },
  {
    id: "compensation",
    title: "경제적 보상",
    subtitle: "보수, 수당, 여비, 복지제도",
    gradient: "from-amber-300 to-orange-400",
  },
  {
    id: "leave",
    title: "휴가·복무제도",
    subtitle: "연차, 휴직, 유연근무, 징계 등",
    gradient: "from-violet-400 to-purple-600",
  },
];

// Compound shadows for the hardcover book effect: an outer "resting on the
// shelf" drop shadow, an inset shadow hugging the left edge to read as the
// spine hinge crease, and a thin inset highlight near the right edge to read
// as a paper-stack edge. Hover widens/lightens only the outer shadow so the
// book looks like it's lifting off the shelf rather than glowing uniformly.
const BOOK_SHADOW =
  "shadow-[0_10px_15px_-8px_rgba(0,0,0,0.35),inset_10px_0_15px_-8px_rgba(0,0,0,0.35),inset_-4px_0_8px_-2px_rgba(255,255,255,0.5)]";
const BOOK_SHADOW_HOVER =
  "hover:shadow-[0_25px_25px_-10px_rgba(0,0,0,0.25),inset_10px_0_15px_-8px_rgba(0,0,0,0.35),inset_-4px_0_8px_-2px_rgba(255,255,255,0.5)]";

// Fine repeating-diagonal-line overlay, blended with mix-blend-overlay, so the
// cover reads as textured cloth/paper instead of a flat CSS gradient.
const BOOK_TEXTURE_STYLE = {
  backgroundImage:
    "repeating-linear-gradient(115deg, rgba(255,255,255,0.35) 0px, rgba(255,255,255,0.35) 1px, transparent 1px, transparent 4px)",
};

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

function BookPage({ page, searchTerm, side, totalPages }) {
  const hasContent = Boolean(page.heading?.trim() || stripHtml(page.html || "").trim());
  return (
    <div className="w-full min-h-full px-14 pt-6 pb-16 relative break-keep">
      <div className="space-y-6">
        <h2 className="text-left font-serif text-[27px] font-bold text-on-surface pb-1.5 border-b-2 border-primary/10 tracking-tight">
          {highlightText(page.heading || "제목 없음", searchTerm)}
        </h2>
        {hasContent ? (
          <div
            className="ck-content !text-[16px] !leading-[1.8] break-keep text-on-surface-variant"
            dangerouslySetInnerHTML={{ __html: highlightHtml(page.html, searchTerm) }}
          />
        ) : (
          <p className="text-center text-body-lg text-outline">아직 작성된 내용이 없습니다.</p>
        )}
      </div>
      <div
        className={`absolute bottom-6 text-[11px] font-light tracking-wide text-outline/60 ${
          side === "left" ? "left-9" : "right-9"
        }`}
      >
        {page.pageNum} / {totalPages}
      </div>
    </div>
  );
}

// In-place page editor — mirrors BookPage's size/padding/typography exactly
// (same px-14/pt-6/pb-16 page box, same heading classes) so flipping between
// read and edit mode never changes the book's apparent size or font ratio.
function BookPageEditor({
  heading,
  html,
  pageNum,
  ckeditorConfig,
  onHeadingChange,
  onHtmlChange,
  editorKey,
  side,
  totalPages,
}) {
  return (
    <div className="w-full h-full min-h-full px-14 pt-6 pb-16 relative break-keep flex flex-col">
      <input
        type="text"
        value={heading}
        onChange={(e) => onHeadingChange(e.target.value)}
        placeholder="제목을 입력하세요"
        className="w-full text-left font-serif text-[27px] font-bold text-on-surface bg-transparent outline-none placeholder:text-outline/40 pb-1.5 mb-8 border-b-2 border-primary/10 focus:border-primary/40 transition-colors shrink-0 tracking-tight"
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
      <div
        className={`absolute bottom-6 text-[11px] font-light tracking-wide text-outline/60 pointer-events-none ${
          side === "left" ? "left-9" : "right-9"
        }`}
      >
        {pageNum} / {totalPages}
      </div>
    </div>
  );
}

// Apple Books-style landing shelf shown before a book is opened. Purely a
// front-end entry point — selecting a part just reveals the existing
// sidebar + book viewer below; it doesn't filter which manuals load.
function Bookshelf({ onSelect }) {
  const [shelfSearchTerm, setShelfSearchTerm] = useState("");
  const query = shelfSearchTerm.trim().toLowerCase();

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="max-w-container_max_width mx-auto px-4 md:px-8 lg:px-16 py-6">
        {/* Champion Hero Banner — same component/regs as every other page */}
        <HeroBanner
          title="업무 첫걸음 서재"
          subtitle="필요한 파트를 선택해서 매뉴얼을 펼쳐보세요."
          imageSrc="/img2.png"
          imageAlt="업무 첫걸음 서재"
        />

        {/* Search bar */}
        <div className="w-full max-w-xl mx-auto mt-8 mb-12">
          <div className="relative">
            <input
              type="text"
              value={shelfSearchTerm}
              onChange={(e) => setShelfSearchTerm(e.target.value)}
              placeholder="매뉴얼 내용 검색..."
              className="w-full pl-5 pr-12 py-3 rounded-full border border-outline-variant bg-white focus:border-primary focus:ring-0 text-body-md transition-all shadow-sm"
            />
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none">
              search
            </span>
          </div>
        </div>

        {/* Books resting on the shelf */}
        <div className="flex flex-wrap items-end justify-center gap-8 lg:gap-14">
          {BOOKSHELF_PARTS.map((part) => {
            const isMatch =
              !query || part.title.toLowerCase().includes(query) || part.subtitle.toLowerCase().includes(query);
            return (
              <button
                key={part.id}
                type="button"
                onClick={() => onSelect(part.id)}
                className={`relative w-44 h-64 md:w-56 md:h-80 shrink-0 rounded-l-sm rounded-r-md border-r-[3px] border-b-[3px] border-gray-100 overflow-hidden bg-gradient-to-br ${part.gradient} transition-all duration-300 hover:-translate-y-6 ${BOOK_SHADOW} ${BOOK_SHADOW_HOVER} ${isMatch ? "opacity-100" : "opacity-30"}`}
              >
                {/* Paper-grain texture */}
                <div
                  className="absolute inset-0 opacity-[0.18] mix-blend-overlay pointer-events-none"
                  style={BOOK_TEXTURE_STYLE}
                />

                {/* Series-unifying obi band, with the title sitting on it */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 py-3.5 px-4 bg-white/15 border-y border-white/25">
                  <span className="block font-serif text-white text-lg md:text-xl font-bold text-center leading-snug">
                    {part.title}
                  </span>
                </div>

                <span className="absolute bottom-5 md:bottom-6 inset-x-4 text-white/80 text-[11px] md:text-[12px] leading-relaxed text-center">
                  {part.subtitle}
                </span>
              </button>
            );
          })}
        </div>

        {/* Shelf board — top face + shaded front face read as real depth */}
        <div className="w-full">
          <div className="h-1.5 bg-white rounded-t-sm border-b border-gray-200/80" />
          <div className="h-3 bg-gray-50 rounded-b-sm shadow-[0_10px_15px_-3px_rgba(0,0,0,0.15)]" />
        </div>
      </div>
    </div>
  );
}

export default function WorkManual() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin";

  const [selectedPartId, setSelectedPartId] = useState(null);

  const [manuals, setManualsState] = useState(() => getCache(CACHE_KEY) ?? []);
  const [isLoading, setIsLoading] = useState(() => !getCache(CACHE_KEY));
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 500);
  const [selectedManualId, setSelectedManualId] = useState(() => getCache(CACHE_KEY)?.[0]?.id ?? null);
  const [spreadIndex, setSpreadIndex] = useState(0);

  const setManuals = useCallback((updater) => {
    setManualsState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      setCache(CACHE_KEY, next);
      return next;
    });
  }, []);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editSessionKey, setEditSessionKey] = useState(0);
  const editSnapshotRef = useRef(null);
  const [ckeditorConfig] = useState(() => createCkeditorConfig("본문을 작성해보세요."));

  const [isReorderMode, setIsReorderMode] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const originalManualsRef = useRef(null);

  useEffect(() => {
    if (getCache(CACHE_KEY)) {
      setIsLoading(false);
      return;
    }

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
    const term = debouncedSearchTerm.trim().toLowerCase();
    if (!term) return manuals;
    return manuals.filter((m) => manualSearchText(m).includes(term));
  }, [manuals, debouncedSearchTerm]);

  const selectedManual = manuals.find((m) => m.id === selectedManualId) ?? null;
  const currentSpread = selectedManual ? selectedManual.spreads[spreadIndex] ?? selectedManual.spreads[0] : null;
  const totalPages = selectedManual ? selectedManual.spreads.length * 2 : 0;
  const progressPercent = totalPages ? Math.round(((spreadIndex + 1) * 2 * 100) / totalPages) : 0;

  function handleSelectManual(id) {
    if (isEditMode || isReorderMode) return;
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

  function enterReorderMode() {
    originalManualsRef.current = manuals;
    setSearchTerm("");
    setIsReorderMode(true);
  }

  function cancelReorder() {
    if (originalManualsRef.current) setManuals(originalManualsRef.current);
    originalManualsRef.current = null;
    setDragIndex(null);
    setIsReorderMode(false);
  }

  function handleDragStart(index) {
    setDragIndex(index);
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setManuals((prev) => {
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
      const res = await fetch("/api/work-manuals", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ order: manuals.map((m) => m.id) }),
      });
      const data = await parseJsonSafely(res);
      if (!res.ok) throw new Error(data.message || "순서 저장에 실패했습니다.");
      originalManualsRef.current = null;
      setIsReorderMode(false);
      setToastMessage("순서가 저장되었습니다.");
    } catch (error) {
      window.alert(error.message);
    } finally {
      setIsSavingOrder(false);
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

  if (selectedPartId === null) {
    return (
      <div className="h-screen w-full flex flex-col bg-background overflow-hidden font-body-md text-on-surface">
        <Header />
        <Bookshelf onSelect={setSelectedPartId} />
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden font-body-md text-on-surface">
      <Header />

      {/* Top bar: return to the bookshelf */}
      <div className="shrink-0 px-6 py-3 border-b border-outline-variant bg-surface-container-low">
        <button
          onClick={() => setSelectedPartId(null)}
          className="flex items-center gap-1.5 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          서재로 돌아가기
        </button>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-full md:w-64 max-h-[40vh] md:max-h-none shrink-0 border-b md:border-b-0 md:border-r border-outline-variant bg-surface-container-low flex flex-col">
          <div className="p-6 border-b border-outline-variant">
            <h2 className="font-headline-md text-base font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">menu_book</span>
              업무 매뉴얼 리스트
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1">
            {isAdmin && (
              <button
                onClick={beginCreate}
                disabled={isEditMode || isReorderMode}
                className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">add_circle</span>
                신규 매뉴얼 등록
              </button>
            )}

            <div className="mb-4 px-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">search</span>
                <span className="text-sm font-medium text-secondary">매뉴얼 검색</span>
              </div>
              <div className="relative flex items-center">
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-0 text-sm pl-3 pr-10 py-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  placeholder="제목, 본문 내용으로 검색..."
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={isReorderMode}
                />
                <span className="absolute right-2 flex items-center justify-center w-8 h-8 bg-primary text-on-primary rounded-md">
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </span>
              </div>
            </div>

            {isAdmin && filteredManuals.length > 1 && (
              <div className="mb-3 px-1 flex justify-end">
                {!isReorderMode ? (
                  <button
                    onClick={enterReorderMode}
                    disabled={isEditMode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant text-[12px] font-bold hover:bg-surface-container-highest transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[16px]">swap_vert</span>
                    순서 변경
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
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
              </div>
            )}

            {isLoading ? (
              <SkeletonList count={5} />
            ) : filteredManuals.length === 0 ? (
              <p className="px-2 py-6 text-center text-label-sm text-on-surface-variant">
                {manuals.length === 0 ? "등록된 매뉴얼이 없습니다." : "검색 결과가 없습니다."}
              </p>
            ) : (
              filteredManuals.map((manual, idx) => (
                <div
                  key={manual.id}
                  draggable={isReorderMode}
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={
                    isReorderMode
                      ? `flex items-center gap-1 rounded-xl border border-outline-variant bg-surface-container-lowest transition-opacity ${
                          dragIndex === idx ? "opacity-40" : "opacity-100"
                        }`
                      : "flex items-center"
                  }
                >
                  {isReorderMode && (
                    <span
                      className="material-symbols-outlined text-on-surface-variant cursor-grab active:cursor-grabbing shrink-0 pl-1.5"
                      style={{ fontSize: "18px" }}
                    >
                      drag_indicator
                    </span>
                  )}
                  <button
                    onClick={() => handleSelectManual(manual.id)}
                    disabled={isEditMode || isReorderMode}
                    className={`flex-1 min-w-0 text-left p-2.5 rounded-xl text-sm transition-all disabled:cursor-not-allowed ${
                      manual.id === selectedManualId
                        ? "bg-primary text-on-primary font-bold shadow-sm"
                        : "hover:bg-surface-container-highest text-on-surface-variant"
                    } ${isEditMode ? "opacity-40" : ""}`}
                  >
                    {highlightText(manual.title || "(제목 없음)", searchTerm)}
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Main Stage */}
        <main className="flex-1 min-h-0 flex flex-col relative bg-[#f1f4f9] overflow-hidden">
          {isAdmin && isEditMode && (
            <input
              type="text"
              value={selectedManual.title}
              onChange={(e) => updateManualTitle(e.target.value)}
              placeholder="매뉴얼 제목을 입력하세요"
              className="absolute top-6 left-1/2 -translate-x-1/2 z-20 w-[360px] px-4 py-2 rounded-full border-2 border-primary/30 bg-white text-center font-bold text-on-surface focus:border-primary focus:ring-0 outline-none transition-colors"
            />
          )}

          {isAdmin && selectedManual && (
            <div className="absolute top-6 right-8 z-20 flex items-center gap-3">
              {isEditMode ? (
                <>
                  <button
                    onClick={cancelEdit}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-outline-variant text-on-surface-variant font-bold hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="absolute left-6 w-12 h-12 rounded-full border border-primary text-primary flex items-center justify-center hover:bg-primary-fixed bg-surface-container-lowest/50 backdrop-blur-sm transition-colors z-30 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[32px]">chevron_left</span>
                </button>
                <button
                  onClick={goNext}
                  disabled={!isEditMode && spreadIndex === selectedManual.spreads.length - 1}
                  className="absolute right-6 w-12 h-12 rounded-full border border-primary text-primary flex items-center justify-center hover:bg-primary-fixed bg-surface-container-lowest/50 backdrop-blur-sm transition-colors z-30 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[32px]">chevron_right</span>
                </button>

                <div className="relative max-w-[1400px] w-full h-full max-h-[820px]">
                  {/* Layered pages behind the cover — staggered, not concentric, so it
                      reads as loosely stacked paper rather than a single outline */}
                  <div className="absolute -left-4 -right-2 top-4 bottom-1 bg-gray-100 rounded-l-md rounded-r-xl shadow-sm z-0 rotate-[0.3deg]" />
                  <div className="absolute -left-2.5 -right-3.5 top-2.5 bottom-2.5 bg-gray-100 rounded-l-md rounded-r-xl shadow-sm z-[1] -rotate-[0.2deg]" />
                  <div className="absolute -left-1 -right-1.5 top-1 bottom-1.5 bg-gray-50 rounded-l-md rounded-r-xl shadow-sm z-[2]" />

                  <div className="relative z-10 shadow-2xl rounded-l-md rounded-r-xl overflow-hidden flex bg-[#faf9f6] h-full">
                    {/* Outer edge shadows — the spread reads as gently convex/curved */}
                    <div className="absolute left-0 top-0 bottom-0 w-6 z-20 pointer-events-none bg-gradient-to-r from-black/[0.06] to-transparent" />
                    <div className="absolute right-0 top-0 bottom-0 w-6 z-20 pointer-events-none bg-gradient-to-l from-black/[0.06] to-transparent" />
                    {/* Center spine — pages dipping concave into the binding */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-28 -ml-14 z-20 pointer-events-none flex">
                      <div className="w-1/2 h-full bg-gradient-to-r from-transparent to-black/[0.12]" />
                      <div className="w-1/2 h-full bg-gradient-to-l from-transparent to-black/[0.12]" />
                    </div>
                    <div className="absolute left-1/2 top-0 bottom-0 w-px -ml-px z-20 pointer-events-none bg-black/10" />
                    <div className="w-1/2 relative overflow-y-auto custom-scrollbar">
                      {isEditMode ? (
                        <BookPageEditor
                          editorKey={`${selectedManualId}-${spreadIndex}-left-${editSessionKey}`}
                          heading={currentSpread.left.heading}
                          html={currentSpread.left.html}
                          pageNum={currentSpread.left.pageNum}
                          ckeditorConfig={ckeditorConfig}
                          onHeadingChange={(v) => updatePageField("left", "heading", v)}
                          onHtmlChange={(v) => updatePageField("left", "html", v)}
                          side="left"
                          totalPages={totalPages}
                        />
                      ) : (
                        <BookPage page={currentSpread.left} searchTerm={searchTerm} side="left" totalPages={totalPages} />
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
                          side="right"
                          totalPages={totalPages}
                        />
                      ) : (
                        <BookPage page={currentSpread.right} searchTerm={searchTerm} side="right" totalPages={totalPages} />
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

        </main>
      </div>

      {/* Floating reading-progress bar — pinned to the viewport bottom so it
          never takes up layout space, unlike the old inline progress block. */}
      {selectedManual && (
        <div className="fixed bottom-0 left-0 w-full h-[3px] bg-surface-container-highest z-40">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {toastMessage && <Toast message={toastMessage} onDone={() => setToastMessage("")} />}
    </div>
  );
}
