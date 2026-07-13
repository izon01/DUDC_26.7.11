import { useMemo, useState } from "react";
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
          docNo: "No. 2024-011",
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
          docNo: "No. 2024-012",
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
        <h2 className="text-headline-lg font-bold text-on-surface">{page.heading}</h2>
        <p className="text-body-lg text-on-surface-variant">해당 매뉴얼 콘텐츠는 준비 중입니다.</p>
        <div className="absolute bottom-8 left-0 right-0 text-center text-body-md text-outline">
          — {page.pageNum} —
        </div>
      </div>
    );
  }

  if (page.html) {
    return (
      <div className="w-full px-14 py-16 relative break-keep">
        <div className="space-y-8">
          <span className="inline-block px-4 py-1.5 bg-secondary-container text-on-secondary-container rounded-full text-body-md font-bold">
            새로 작성된 글
          </span>
          <h2 className="text-center text-headline-lg font-bold text-on-surface pb-6 border-b-2 border-primary/10">
            {page.heading}
          </h2>
          <div
            className="ck-content !text-[18px] !leading-[1.9] break-keep text-on-surface-variant"
            dangerouslySetInnerHTML={{ __html: page.html }}
          />
        </div>
        <div className="absolute bottom-8 left-0 right-0 text-center text-body-md text-outline">
          — {page.pageNum} —
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-14 py-16 relative break-keep">
      <div className="space-y-10">
        {page.docNo && <div className="text-right text-[14px] text-outline">{page.docNo}</div>}
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
      <div className="absolute bottom-8 left-0 right-0 text-center text-body-md text-outline">
        — {page.pageNum} —
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
  const [ckeditorConfig] = useState(() =>
    createCkeditorConfig("본문을 작성해보세요. 오른쪽 페이지에서 실시간으로 확인할 수 있어요.")
  );

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
          <div className="w-[92vw] h-[88vh] max-w-[1600px] bg-surface-container-lowest rounded-2xl border-2 border-dashed border-outline-variant shadow-2xl overflow-hidden flex flex-col animate-scale-in">
            {/* Modal Header */}
            <div className="px-8 py-5 border-b-2 border-dashed border-outline-variant flex items-center justify-between bg-primary-fixed/30 shrink-0">
              <h2 className="text-headline-md font-headline-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  {editorMode === "edit" ? "edit_note" : "auto_stories"}
                </span>
                {editorMode === "edit" ? "매뉴얼 수정" : "신규 매뉴얼 작성"}
              </h2>
              <button
                onClick={closeEditor}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>

            {/* Book-style Editor + Live Preview */}
            <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
              <div className="relative w-full h-full">
                <div className="absolute -left-2 top-2 bottom-2 w-4 bg-surface-container-highest rounded-l-lg shadow-sm z-0" />
                <div className="absolute -left-1 top-1 bottom-1 w-4 bg-surface-container-high rounded-l-lg shadow-sm z-0" />
                <div className="absolute -right-2 top-2 bottom-2 w-4 bg-surface-container-highest rounded-r-lg shadow-sm z-0" />
                <div className="absolute -right-1 top-1 bottom-1 w-4 bg-surface-container-high rounded-r-lg shadow-sm z-0" />

                <div className="relative z-10 shadow-2xl rounded-lg overflow-hidden flex bg-surface-container-lowest h-full">
                  <div className="absolute left-1/2 top-0 bottom-0 w-8 -ml-4 bg-gradient-to-r from-black/5 via-black/10 to-black/5 z-20 pointer-events-none border-x border-outline-variant/10" />

                  {/* Left Page: Editor */}
                  <div className="w-1/2 border-r border-outline-variant/20 flex flex-col overflow-hidden">
                    <div className="px-14 pt-16 pb-6 shrink-0">
                      <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-body-md font-bold mb-6">
                        {editorMode === "edit" ? "수정 중" : "편집 중"}
                      </span>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="제목을 입력하세요"
                        className="w-full text-center text-headline-lg font-bold text-on-surface bg-transparent border-none outline-none placeholder:text-outline/40 pb-6 border-b-2 border-primary/10"
                      />
                    </div>
                    <div className="flex-1 min-h-0 px-14 pb-10">
                      <div className="dudc-ckeditor dudc-ckeditor-lg rounded-xl overflow-hidden h-full">
                        <CKEditor
                          editor={ClassicEditor}
                          data={newContent}
                          config={ckeditorConfig}
                          onChange={(_event, editor) => setNewContent(editor.getData())}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Page: Live Preview */}
                  <div className="w-1/2 relative overflow-y-auto custom-scrollbar">
                    <BookPage
                      page={{
                        heading: newTitle.trim() || "제목을 입력해주세요",
                        html: newContent,
                        pageNum: 1,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-8 py-5 border-t-2 border-dashed border-outline-variant flex items-center justify-between bg-surface-container-low shrink-0">
              <p className="text-label-sm text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                오른쪽 페이지에서 실시간 미리보기를 확인하세요.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={closeEditor}
                  className="px-6 py-2.5 rounded-full border-2 border-dashed border-outline-variant text-on-surface-variant font-bold text-label-sm hover:bg-surface-container-lowest transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveManual}
                  className="px-6 py-2.5 rounded-full bg-primary text-on-primary font-bold text-label-sm hover:opacity-90 active:scale-95 transition-all"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
