import { useMemo, useRef, useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import "ckeditor5/ckeditor5.css";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { ClassicEditor, createCkeditorConfig } from "../ckeditorConfig";

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

// Converts a page's structured or placeholder content into editable HTML for the CKEditor.
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
    // Source strings already carry their own "1. ..." numbering (read mode
    // renders them as a bulleted list), so use <ul> here too — <ol> would
    // double up the numbering with the browser's own list counter.
    chunks.push(`<ul>${page.list.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`);
  }
  if (page.bullets) {
    chunks.push(`<ul>${page.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>`);
  }
  if (page.note) {
    chunks.push(`<p>${escapeHtml(page.note)}</p>`);
  }
  return chunks.join("");
}

// Converts any page shape (placeholder / structured / html) into the flat
// { heading, html, pageNum } shape the spread editor reads and writes.
function toEditablePage(page) {
  return {
    heading: page?.heading || "",
    html: pageToEditableHtml(page),
    pageNum: page?.pageNum,
  };
}

function BookPage({ page }) {
  if (page.placeholder) {
    return (
      <div className="w-full min-h-full px-14 pt-6 pb-16 flex flex-col items-center justify-center text-center gap-4 relative break-keep">
        <span className="material-symbols-outlined text-primary/20 text-[64px]">construction</span>
        <h2 className="text-headline-lg font-bold text-on-surface">{page.heading}</h2>
        <p className="text-body-lg text-on-surface-variant">해당 매뉴얼 콘텐츠는 준비 중입니다.</p>
        <div className="absolute bottom-8 left-0 w-full text-center text-body-md text-outline">
          — {page.pageNum} —
        </div>
      </div>
    );
  }

  if (page.html) {
    return (
      <div className="w-full min-h-full px-14 pt-6 pb-16 relative break-keep">
        <div className="space-y-8">
          <h2 className="text-center text-headline-lg font-bold text-on-surface pb-6 border-b-2 border-primary/10">
            {page.heading}
          </h2>
          <div
            className="ck-content !text-[18px] !leading-[1.9] break-keep text-on-surface-variant"
            dangerouslySetInnerHTML={{ __html: page.html }}
          />
        </div>
        <div className="absolute bottom-8 left-0 w-full text-center text-body-md text-outline">
          — {page.pageNum} —
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full px-14 pt-6 pb-16 relative break-keep">
      <div className="space-y-10">
        <h2 className="text-center text-headline-lg font-bold text-on-surface pb-6 border-b-2 border-primary/10">
          {page.heading}
        </h2>

        {page.sections && (
          <div className="space-y-8">
            {page.sections.map((section) => (
              <div key={section.title}>
                <h3 className="text-[19px] font-bold text-primary flex items-center gap-3 mb-3">
                  <span className="w-2 h-7 bg-primary rounded-full" />
                  {section.title}
                </h3>
                <p className="pl-6 text-body-lg leading-[1.9] text-on-surface-variant break-keep">{section.body}</p>
              </div>
            ))}
          </div>
        )}

        {page.list && (
          <ul className="space-y-4 pl-2">
            {page.list.map((item) => (
              <li key={item} className="flex items-center gap-3 text-body-lg text-on-surface-variant">
                <span className="text-primary">●</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        {page.bullets && (
          <ul className="pl-6 space-y-3">
            {page.bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-3 text-body-lg text-on-surface-variant">
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
              <span className="text-body-md">[신규 입사자 참고]</span>
            </div>
            <p className="text-body-lg text-on-surface-variant leading-relaxed break-keep">{page.note}</p>
          </div>
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
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [manuals, setManuals] = useState(INITIAL_MANUALS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedManualId, setSelectedManualId] = useState(INITIAL_MANUALS[0].id);
  const [spreadIndex, setSpreadIndex] = useState(0);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editSessionKey, setEditSessionKey] = useState(0);
  const editSnapshotRef = useRef(null);
  const [ckeditorConfig] = useState(() => createCkeditorConfig("본문을 작성해보세요."));

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
    if (isEditMode) return;
    setSelectedManualId(id);
    setSpreadIndex(0);
  }

  // Makes sure the given spread's pages are in the flat editable shape,
  // converting placeholder/structured content on first visit while leaving
  // already-editable pages (and any in-progress edits) untouched.
  function ensureSpreadEditable(idx) {
    setManuals((prev) =>
      prev.map((manual) => {
        if (manual.id !== selectedManualId) return manual;
        const updatedSpreads = manual.spreads.map((spread, i) => {
          if (i !== idx) return spread;
          return {
            left: spread.left?.html !== undefined ? spread.left : toEditablePage(spread.left),
            right: spread.right?.html !== undefined ? spread.right : toEditablePage(spread.right),
          };
        });
        return { ...manual, spreads: updatedSpreads };
      })
    );
  }

  function goPrev() {
    const target = spreadIndex - 1;
    if (target < 0) return;
    if (isEditMode) ensureSpreadEditable(target);
    setSpreadIndex(target);
  }

  function goNext() {
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
    if (isEditMode) ensureSpreadEditable(target);
    setSpreadIndex(target);
  }

  function beginCreate() {
    editSnapshotRef.current = { manuals, selectedManualId, spreadIndex };
    const newManual = {
      id: `custom-${Date.now()}`,
      title: "",
      badge: "새 글",
      spreads: [
        {
          left: { heading: "", html: "", pageNum: 1 },
          right: { heading: "", html: "", pageNum: 2 },
        },
      ],
    };
    setManuals((prev) => [...prev, newManual]);
    setSelectedManualId(newManual.id);
    setSpreadIndex(0);
    setEditSessionKey((k) => k + 1);
    setIsEditMode(true);
  }

  function beginEdit() {
    editSnapshotRef.current = { manuals, selectedManualId, spreadIndex };
    ensureSpreadEditable(spreadIndex);
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

  function finishEdit() {
    if (!selectedManual.title.trim()) {
      window.alert("매뉴얼 제목을 입력해주세요.");
      return;
    }
    editSnapshotRef.current = null;
    setIsEditMode(false);
  }

  function handleDeleteManual() {
    if (manuals.length <= 1) {
      window.alert("최소 1개의 매뉴얼은 남아 있어야 합니다.");
      return;
    }
    if (!window.confirm("정말 이 매뉴얼을 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.")) return;

    const remaining = manuals.filter((m) => m.id !== selectedManualId);
    setManuals(remaining);
    setSelectedManualId(remaining[0].id);
    setSpreadIndex(0);
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
                disabled={isEditMode}
                className={
                  manual.id === selectedManualId
                    ? "w-full text-left p-3 rounded-xl bg-primary text-on-primary font-bold transition-all shadow-sm disabled:cursor-not-allowed"
                    : "w-full text-left p-3 rounded-xl hover:bg-surface-container-highest text-on-surface-variant transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                }
              >
                {manual.title || "(제목 없음)"}
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
          {isAdmin && isEditMode && (
            <input
              type="text"
              value={selectedManual.title}
              onChange={(e) => updateManualTitle(e.target.value)}
              placeholder="매뉴얼 제목을 입력하세요"
              className="absolute top-6 left-1/2 -translate-x-1/2 z-20 w-[360px] px-4 py-2 rounded-full border-2 border-dashed border-primary/30 bg-white text-center font-bold text-on-surface focus:border-primary focus:ring-0 outline-none transition-colors"
            />
          )}

          {isAdmin && (
            <div className="absolute top-6 right-8 z-20 flex items-center gap-3">
              {isEditMode ? (
                <>
                  <button
                    onClick={cancelEdit}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-dashed border-outline-variant text-on-surface-variant font-bold hover:bg-white transition-all"
                  >
                    취소
                  </button>
                  <button
                    onClick={finishEdit}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-full font-bold hover:opacity-90 active:scale-95 transition-all shadow-md"
                  >
                    저장
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
                    <BookPage page={currentSpread.left} />
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
                    <BookPage page={currentSpread.right} />
                  )}
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
    </div>
  );
}
