import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";

const QUILL_MODULES = {
  toolbar: [
    [{ size: ["small", false, "large", "huge"] }],
    ["bold", "underline"],
    [{ color: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
  ],
};

const QUILL_FORMATS = ["size", "bold", "underline", "color", "list", "align"];

function placeholderSpread(title) {
  return {
    left: {
      heading: title,
      placeholder: true,
      pageNum: 1,
    },
    right: {
      heading: "준비 중",
      placeholder: true,
      pageNum: 2,
    },
  };
}

const INITIAL_MANUALS = [
  {
    id: "guide-v1",
    title: "신규 입사자 가이드 v1.2",
    badge: "필독 매뉴얼",
    spreads: [
      {
        left: {
          heading: "0. 온보딩 첫걸음",
          sections: [
            {
              title: "환영합니다",
              body: "DUDC의 새 가족이 되신 것을 진심으로 환영합니다. 이 매뉴얼은 여러분의 성공적인 적응을 돕기 위해 제작되었습니다.",
            },
            {
              title: "매뉴얼 구성",
              body: "근태, 인프라, 복지 등 핵심 정보를 안내합니다. 좌측 목록에서 다른 매뉴얼로 이동할 수 있어요.",
            },
          ],
          pageNum: 1,
        },
        right: {
          heading: "I. 목차",
          list: [
            "1. 근태 및 기초 복무 가이드",
            "2. 사내 인프라 및 시스템",
            "3. 복리후생 프로그램 안내",
            "4. 자주 묻는 질문",
          ],
          pageNum: 2,
        },
      },
      {
        left: {
          heading: "I. 근태 및 기초 복무 가이드",
          sections: [
            {
              title: "1. 근무 시간 안내",
              body: "표준 근무 시간은 09:00 ~ 18:00 이며, 유연근무제 신청 시 08:00 ~ 10:00 사이 자율 출근이 가능합니다.",
            },
            {
              title: "2. 근태 체크 방식",
              body: "사내 인트라넷 'DUDC Space'를 통한 모바일 체크인을 원칙으로 합니다. 건물 진입 시 보안 카드를 반드시 태그해 주세요.",
            },
            {
              title: "3. 휴가 신청 절차",
              body: "연차 및 반차는 사용일 최소 3일 전까지 팀장 전결을 통해 신청을 완료해야 합니다.",
            },
          ],
          pageNum: 3,
        },
        right: {
          heading: "II. 사내 인프라 및 시스템",
          sections: [
            {
              title: "1. 업무 장비 지급",
              body: "MacBook Pro 16인치 또는 Windows Workstation 중 선택 가능하며, 듀얼 모니터와 주변기기가 기본 제공됩니다.",
            },
          ],
          bullets: ["퇴근 시 장비 잠금 확인 필수", "USB 등 외부 저장 매체 사용 금지"],
          note: "시스템 계정은 입사 당일 오전 중 생성됩니다. 문제 발생 시 7층 IT지원센터(내선 104)로 문의 바랍니다.",
          pageNum: 4,
        },
      },
    ],
  },
  { id: "intranet", title: "사내 인트라넷 활용법", spreads: [placeholderSpread("사내 인트라넷 활용법")] },
  { id: "attendance", title: "근태 및 휴가 규정", spreads: [placeholderSpread("근태 및 휴가 규정")] },
  { id: "security", title: "보안 및 자산 관리 수칙", spreads: [placeholderSpread("보안 및 자산 관리 수칙")] },
  { id: "collab", title: "부서별 협업 프로세스", spreads: [placeholderSpread("부서별 협업 프로세스")] },
  { id: "benefits", title: "복리후생 프로그램 안내", spreads: [placeholderSpread("복리후생 프로그램 안내")] },
];

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, " ");
}

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Flattens a page's structured or html content into plain text for search.
function pageSearchText(page) {
  if (!page) return "";
  const parts = [page.heading, page.note];
  if (page.sections) page.sections.forEach((s) => parts.push(s.title, s.body));
  if (page.list) parts.push(...page.list);
  if (page.bullets) parts.push(...page.bullets);
  if (page.html) parts.push(stripHtml(page.html));
  return parts.filter(Boolean).join(" ");
}

function manualSearchText(manual) {
  return [manual.title, ...manual.spreads.flatMap((s) => [pageSearchText(s.left), pageSearchText(s.right)])]
    .join(" ")
    .toLowerCase();
}

// Converts a page's structured or placeholder content into editable HTML for the Quill editor.
function pageToEditableHtml(page) {
  if (!page || page.placeholder) return "";
  if (page.html) return page.html;

  const chunks = [];
  if (page.sections) {
    page.sections.forEach((section) => {
      chunks.push(`<p><strong>${escapeHtml(section.title)}</strong></p>`);
      chunks.push(`<p>${escapeHtml(section.body)}</p>`);
    });
  }
  if (page.list) {
    chunks.push(`<ol>${page.list.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>`);
  }
  if (page.bullets) {
    chunks.push(`<ul>${page.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>`);
  }
  if (page.note) {
    chunks.push(`<p>${escapeHtml(page.note)}</p>`);
  }
  return chunks.join("");
}

function BookPage({ page }) {
  if (page.placeholder) {
    return (
      <div className="w-full px-14 py-16 flex flex-col items-center justify-center text-center gap-4 relative break-keep">
        <span className="material-symbols-outlined text-primary/20 text-[64px]">construction</span>
        <h2 className="text-2xl font-semibold text-on-surface">{page.heading}</h2>
        <p className="text-base text-on-surface-variant">해당 매뉴얼 콘텐츠는 준비 중입니다.</p>
        <div className="absolute bottom-8 left-0 right-0 text-center text-label-sm text-outline">
          — {page.pageNum} —
        </div>
      </div>
    );
  }

  if (page.html) {
    return (
      <div className="w-full px-14 py-16 relative break-keep">
        <div className="space-y-8">
          <h2 className="text-center text-2xl font-semibold text-on-surface pb-5 mb-2 border-b-2 border-primary/10">
            {page.heading}
          </h2>
          <div
            className="ql-editor !p-0 !text-base !leading-relaxed break-keep text-on-surface-variant"
            dangerouslySetInnerHTML={{ __html: page.html }}
          />
        </div>
        <div className="absolute bottom-8 left-0 right-0 text-center text-label-sm text-outline">
          — {page.pageNum} —
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-14 py-16 relative break-keep">
      <div className="space-y-12">
        <h2 className="text-center text-2xl font-semibold text-on-surface pb-5 mb-2 border-b-2 border-primary/10">
          {page.heading}
        </h2>

        {page.sections && (
          <div className="space-y-10">
            {page.sections.map((section) => (
              <div key={section.title}>
                <h3 className="text-lg font-bold text-primary flex items-center gap-3 mb-4">
                  <span className="w-2 h-6 bg-primary rounded-full" />
                  {section.title}
                </h3>
                <p className="pl-6 text-base leading-relaxed text-on-surface-variant break-keep">{section.body}</p>
              </div>
            ))}
          </div>
        )}

        {page.list && (
          <ul className="space-y-4 pl-2">
            {page.list.map((item) => (
              <li key={item} className="flex items-center gap-3 text-base text-on-surface-variant">
                <span className="text-primary">●</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        {page.bullets && (
          <ul className="pl-6 space-y-3">
            {page.bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-3 text-base text-on-surface-variant">
                <span className="text-primary mt-1.5">●</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        )}

        {page.note && (
          <div className="p-6 bg-primary/5 border border-dashed border-primary/20 rounded-xl">
            <div className="flex items-center gap-2 text-primary font-bold mb-2">
              <span className="material-symbols-outlined text-[20px]">info</span>
              <span className="text-label-sm">[신규 입사자 참고]</span>
            </div>
            <p className="text-base text-on-surface-variant leading-relaxed break-keep">{page.note}</p>
          </div>
        )}
      </div>
      <div className="absolute bottom-8 left-0 right-0 text-center text-label-sm text-outline">
        — {page.pageNum} —
      </div>
    </div>
  );
}

// Single flowing Quill editor whose content auto-paginates across book-style
// spreads using CSS multi-column layout: when a page's column fills up, the
// browser natively flows the remaining text into the next column (page).
function FlowingBookEditor({ value, onChange }) {
  const boxRef = useRef(null);
  const quillRef = useRef(null);
  const [boxSize, setBoxSize] = useState({ width: 0, height: 0 });
  const [toolbarHeight, setToolbarHeight] = useState(46);
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const COLUMN_GAP = 144;
  const MAX_PAGES = 60;

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setBoxSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const editor = quillRef.current?.getEditor?.();
    const toolbarEl = editor?.container?.previousElementSibling;
    if (!toolbarEl) return undefined;
    const observer = new ResizeObserver((entries) => {
      setToolbarHeight(entries[0].contentRect.height);
    });
    observer.observe(toolbarEl);
    return () => observer.disconnect();
  }, []);

  const pageWidth = boxSize.width > 0 ? Math.max(160, (boxSize.width - COLUMN_GAP) / 2) : 0;
  const pageHeight = boxSize.height > 0 ? Math.max(160, boxSize.height - toolbarHeight) : 0;
  const spreadWidth = pageWidth * 2 + COLUMN_GAP;
  const totalSpreads = Math.max(1, Math.ceil(totalPages / 2));
  // Chromium mis-sizes multicol content under `width: max-content` (fabricates
  // dozens of near-empty columns), so the flow track uses a generous fixed
  // pixel width instead, and actual page count is derived from where the
  // last character lands rather than from scrollWidth.
  const flowWidth = pageWidth > 0 ? pageWidth * MAX_PAGES + COLUMN_GAP * (MAX_PAGES - 1) : 6000;

  useEffect(() => {
    const editor = quillRef.current?.getEditor?.();
    if (!editor || pageWidth <= 0) return undefined;
    const recompute = () => {
      const length = editor.getLength();
      const bounds = editor.getBounds(Math.max(0, length - 1));
      const rightEdge = bounds.left + bounds.width;
      const pages = Math.min(MAX_PAGES, Math.max(1, Math.ceil(rightEdge / (pageWidth + COLUMN_GAP))));
      setTotalPages(pages);
    };
    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(editor.root);
    return () => observer.disconnect();
  }, [pageWidth, value]);

  useEffect(() => {
    setSpreadIndex((idx) => Math.min(idx, totalSpreads - 1));
  }, [totalSpreads]);

  function handleSelectionChange(range, source, editor) {
    if (!range || pageWidth <= 0) return;
    const bounds = editor.getBounds(range.index);
    const target = Math.max(0, Math.min(totalSpreads - 1, Math.floor(bounds.left / spreadWidth)));
    setSpreadIndex((prev) => (prev !== target ? target : prev));
  }

  function goPrev() {
    setSpreadIndex((i) => Math.max(0, i - 1));
  }

  function goNext() {
    setSpreadIndex((i) => Math.min(totalSpreads - 1, i + 1));
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <button
        onClick={goPrev}
        disabled={spreadIndex === 0}
        className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-dashed border-primary text-primary flex items-center justify-center hover:bg-primary-fixed bg-surface-container-lowest/70 backdrop-blur-sm transition-colors z-30 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <span className="material-symbols-outlined text-[32px]">chevron_left</span>
      </button>
      <button
        onClick={goNext}
        disabled={spreadIndex >= totalSpreads - 1}
        className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-dashed border-primary text-primary flex items-center justify-center hover:bg-primary-fixed bg-surface-container-lowest/70 backdrop-blur-sm transition-colors z-30 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <span className="material-symbols-outlined text-[32px]">chevron_right</span>
      </button>

      <div ref={boxRef} className="relative w-full h-full max-w-[1400px] max-h-[820px]">
        <div className="absolute -left-2 top-2 bottom-2 w-4 bg-surface-container-highest rounded-l-lg shadow-sm z-0" />
        <div className="absolute -left-1 top-1 bottom-1 w-4 bg-surface-container-high rounded-l-lg shadow-sm z-0" />
        <div className="absolute -right-2 top-2 bottom-2 w-4 bg-surface-container-highest rounded-r-lg shadow-sm z-0" />
        <div className="absolute -right-1 top-1 bottom-1 w-4 bg-surface-container-high rounded-r-lg shadow-sm z-0" />

        <div className="relative z-10 shadow-2xl rounded-lg overflow-hidden bg-surface-container-lowest h-full">
          <div className="absolute left-1/2 top-0 bottom-0 w-8 -ml-4 bg-gradient-to-r from-black/5 via-black/10 to-black/5 z-20 pointer-events-none border-x border-outline-variant/10" />

          {pageWidth > 0 ? (
            <div
              className="dudc-quill-flow"
              style={{
                "--page-width": `${pageWidth}px`,
                "--page-height": `${pageHeight}px`,
                "--column-gap": `${COLUMN_GAP}px`,
                "--flow-width": `${flowWidth}px`,
                "--spread-offset": `-${spreadIndex * spreadWidth}px`,
              }}
            >
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={value}
                onChange={onChange}
                onChangeSelection={handleSelectionChange}
                modules={QUILL_MODULES}
                formats={QUILL_FORMATS}
                placeholder="여기에 매뉴얼 내용을 적어보세요. 페이지가 꽉 차면 자동으로 다음 장으로 넘어갑니다."
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-body-md">
              준비 중...
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 text-label-sm text-outline">
        {spreadIndex + 1} / {totalSpreads} 스프레드 · 총 {totalPages}페이지
      </div>
    </div>
  );
}

export default function WorkManual() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [manuals, setManuals] = useState(INITIAL_MANUALS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedManualId, setSelectedManualId] = useState(INITIAL_MANUALS[0].id);
  const [spreadIndex, setSpreadIndex] = useState(0);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState("create"); // "create" | "edit"
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const filteredManuals = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return manuals;
    return manuals.filter((m) => manualSearchText(m).includes(term));
  }, [manuals, searchTerm]);

  const selectedManual = manuals.find((m) => m.id === selectedManualId) ?? manuals[0];
  const currentSpread = selectedManual.spreads[spreadIndex] ?? selectedManual.spreads[0];
  const totalPages = selectedManual.spreads.length * 2;
  const progressPercent = Math.round(((spreadIndex + 1) * 2 * 100) / totalPages);

  function handleSelectManual(id) {
    setSelectedManualId(id);
    setSpreadIndex(0);
  }

  function goPrev() {
    setSpreadIndex((idx) => Math.max(0, idx - 1));
  }

  function goNext() {
    setSpreadIndex((idx) => Math.min(selectedManual.spreads.length - 1, idx + 1));
  }

  function openCreateModal() {
    setEditorMode("create");
    setNewTitle("");
    setNewContent("");
    setIsEditorOpen(true);
  }

  function openEditModal() {
    setEditorMode("edit");
    setNewTitle(selectedManual.title);
    setNewContent(pageToEditableHtml(currentSpread.left));
    setIsEditorOpen(true);
  }

  function closeEditor() {
    setIsEditorOpen(false);
  }

  function handleSaveManual() {
    const title = newTitle.trim();
    const isContentEmpty = newContent.replace(/<(.|\n)*?>/g, "").trim().length === 0;
    if (!title || isContentEmpty) return;

    if (editorMode === "edit") {
      setManuals((prev) =>
        prev.map((manual) => {
          if (manual.id !== selectedManualId) return manual;
          const updatedSpreads = manual.spreads.map((spread, idx) =>
            idx === spreadIndex
              ? { ...spread, left: { heading: title, html: newContent, pageNum: spread.left.pageNum } }
              : spread
          );
          return { ...manual, title, spreads: updatedSpreads };
        })
      );
    } else {
      const newManual = {
        id: `custom-${Date.now()}`,
        title,
        badge: "새 글",
        spreads: [
          {
            left: { heading: title, html: newContent, pageNum: 1 },
            right: { heading: "다음 페이지를 기다리는 중", placeholder: true, pageNum: 2 },
          },
        ],
      };
      setManuals((prev) => [...prev, newManual]);
      setSelectedManualId(newManual.id);
      setSpreadIndex(0);
    }

    setIsEditorOpen(false);
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
                onClick={openCreateModal}
                className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm"
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
                  className="w-full bg-surface-container-lowest border border-dashed border-outline-variant rounded-lg focus:border-primary focus:ring-0 text-body-md pl-3 pr-10 py-2 transition-all"
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

            {filteredManuals.length === 0 && (
              <p className="px-2 py-6 text-center text-label-sm text-on-surface-variant">검색 결과가 없습니다.</p>
            )}

            {filteredManuals.map((manual) => (
              <button
                key={manual.id}
                onClick={() => handleSelectManual(manual.id)}
                className={
                  manual.id === selectedManualId
                    ? "w-full text-left p-3 rounded-xl bg-primary text-on-primary font-bold transition-all shadow-sm"
                    : "w-full text-left p-3 rounded-xl hover:bg-surface-container-highest text-on-surface-variant transition-all"
                }
              >
                {manual.title}
              </button>
            ))}
          </div>

          <div className="p-6">
            <div className="p-4 bg-tertiary-fixed rounded-2xl border border-dashed border-tertiary-container relative">
              <p className="text-label-sm text-on-tertiary-fixed leading-tight">
                궁금한 점은 사내 메신저 '두닥챗'을 이용해주세요!
              </p>
              <div className="mt-2 flex justify-end">
                <span className="material-symbols-outlined text-tertiary text-[24px]">pest_control_rodent</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Stage */}
        <main className="flex-1 flex flex-col relative bg-[#f1f4f9] overflow-hidden">
          {isAdmin && (
            <button
              onClick={openEditModal}
              className="absolute top-6 right-8 z-20 flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-full font-bold hover:opacity-90 active:scale-95 transition-all shadow-md"
            >
              <span className="material-symbols-outlined">edit</span>
              <span className="text-body-md">수정</span>
            </button>
          )}

          <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
            <button
              onClick={goPrev}
              disabled={spreadIndex === 0}
              className="absolute left-6 w-12 h-12 rounded-full border border-dashed border-primary text-primary flex items-center justify-center hover:bg-primary-fixed bg-surface-container-lowest/50 backdrop-blur-sm transition-colors z-30 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[32px]">chevron_left</span>
            </button>
            <button
              onClick={goNext}
              disabled={spreadIndex === selectedManual.spreads.length - 1}
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
                  <BookPage page={currentSpread.left} />
                </div>
                <div className="w-1/2 relative overflow-y-auto custom-scrollbar">
                  <BookPage page={currentSpread.right} />
                </div>
              </div>
            </div>
          </div>

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
        </main>
      </div>

      {isAdmin && isEditorOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="relative w-[92vw] h-[88vh] max-w-[1600px] bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-in">
            {/* Floating close button — no header bar */}
            <button
              onClick={closeEditor}
              className="absolute top-5 right-5 z-40 w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-lowest/80 backdrop-blur-sm shadow-md hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-on-surface-variant">close</span>
            </button>

            {/* Title — sits directly on the page, no border */}
            <div className="shrink-0 pt-10 pb-2 px-16">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                className="w-full text-center text-2xl font-semibold text-on-surface bg-transparent border-none outline-none placeholder:text-outline/40"
              />
            </div>

            {/* Flowing book editor */}
            <div className="flex-1 min-h-0 px-8 pb-6">
              <FlowingBookEditor value={newContent} onChange={setNewContent} />
            </div>

            {/* Floating save button — no footer bar */}
            <button
              onClick={handleSaveManual}
              className="absolute bottom-6 right-8 z-40 px-6 py-2.5 rounded-full bg-primary text-on-primary font-bold text-label-sm shadow-lg hover:opacity-90 active:scale-95 transition-all"
            >
              저장
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
