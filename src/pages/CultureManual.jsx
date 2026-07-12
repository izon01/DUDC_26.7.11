import { useMemo, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    [{ size: ["small", false, "large", "huge"] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["blockquote", "link"],
    ["clean"],
  ],
};

const QUILL_FORMATS = [
  "header",
  "size",
  "bold",
  "italic",
  "underline",
  "strike",
  "color",
  "background",
  "list",
  "align",
  "blockquote",
  "link",
];

const INITIAL_GUIDES = [
  {
    id: "g1",
    label: "Guide 01",
    title: "사내 예절 안내",
    bodyHtml:
      "<h2>인사 예절의 기본</h2><p>DUDC의 문화는 상호 존중에서 시작됩니다. 아침 출근 시, 회의실 입장 시, 그리고 퇴근 시 가벼운 목례와 인사를 건네보세요. 작은 배려가 즐거운 근무 환경을 만듭니다.</p><h2>복장 및 근무 매너</h2><p>자율 복장을 원칙으로 하되, 외부 미팅이 있는 날은 비즈니스 캐주얼을 권장합니다.</p><h2>회의실 이용 예절</h2><p>회의실은 반드시 사전 예약 후 이용하며, 사용 후에는 원상태로 정리해주세요.</p><h2>호칭 문화</h2><p>DUDC는 직급 대신 '님' 호칭을 사용하는 수평적 커뮤니케이션 문화를 지향합니다.</p><h2>마무리 인사</h2><p>사내 예절 안내를 모두 읽어주셔서 감사합니다. 다음 가이드에서 협업 툴 활용법을 안내해 드릴게요.</p>",
    checkPoints: [
      "출입구에서 동료를 만나면 밝게 인사하기",
      "엘리베이터 안에서는 조용히 대화하기",
      "회의 시작 5분 전 도착 매너 지키기",
      "외부 미팅 시 단정한 복장 착용",
      "공용 공간 정숙 유지",
      "예약 없이 장시간 점유 금지",
      "사용 후 화이트보드 지우기",
      "이름 + 님으로 호칭하기",
      "존댓말 사용을 기본으로 하기",
      "궁금한 점은 지식 베이스에서 검색하기",
    ],
  },
  {
    id: "g2",
    label: "Guide 02",
    title: "메일 및 협업 툴 활용",
    bodyHtml:
      "<h2>협업 툴 소개</h2><p>DUDC는 '두닥챗'과 'DUDC Space'를 통해 소통하고 업무를 관리합니다. 입사 첫날 계정을 확인해주세요.</p>",
    checkPoints: ["두닥챗 알림 설정 확인", "DUDC Space 프로필 등록"],
  },
  {
    id: "g3",
    label: "Guide 03",
    title: "보고 체계 및 일정 관리",
    bodyHtml:
      "<h2>보고 체계 안내</h2><p>모든 업무 보고는 팀장 → 실장 순으로 이루어지며, 주간 업무 계획은 매주 월요일 오전에 공유합니다.</p>",
    checkPoints: ["주간 보고서 양식 준수", "일정 변경 시 사전 공유"],
  },
  {
    id: "g4",
    label: "Guide 04",
    title: "회식 및 소통 문화",
    bodyHtml:
      "<h2>건강한 회식 문화</h2><p>DUDC는 강요 없는 회식 문화를 지향합니다. 참여는 자율이며, 점심 회식도 적극 권장합니다.</p>",
    checkPoints: ["회식 참여는 자율 선택", "음주 강요 금지"],
  },
];

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, " ");
}

function guideSearchText(guide) {
  const parts = [guide.title, stripHtml(guide.bodyHtml || ""), ...(guide.checkPoints || [])];
  return parts.filter(Boolean).join(" ").toLowerCase();
}

// Full-width, single-column editor canvas (Naver-blog-style) that replaces the
// entire reading area while an admin creates or edits a culture post.
function CulturePostEditor({ mode, initialValues, onCancel, onSave }) {
  const [title, setTitle] = useState(initialValues.title);
  const [bodyHtml, setBodyHtml] = useState(initialValues.bodyHtml);
  const [checkPointsText, setCheckPointsText] = useState(initialValues.checkPoints.join("\n"));

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
            className="px-5 py-2 rounded-full border border-outline-variant text-on-surface-variant font-bold text-[13px] hover:bg-surface-container-low transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 rounded-full bg-primary text-white font-bold text-[13px] hover:bg-primary/90 active:scale-95 transition-all"
          >
            저장
          </button>
        </div>
      </div>

      <div className="max-w-5xl w-full mx-auto px-10 py-10">
        <div className="dudc-quill dudc-quill-sticky">
          <ReactQuill
            theme="snow"
            value={bodyHtml}
            onChange={setBodyHtml}
            modules={QUILL_MODULES}
            formats={QUILL_FORMATS}
            placeholder="본문 내용을 자유롭게 작성해보세요."
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
            className="w-full bg-white border border-dashed border-outline-variant rounded-lg px-4 py-3 text-[14px] focus:border-primary focus:ring-0 transition-all resize-none"
          />
        </div>
      </div>
    </div>
  );
}

export default function CultureManual() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [guides, setGuides] = useState(INITIAL_GUIDES);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGuideId, setSelectedGuideId] = useState(INITIAL_GUIDES[0].id);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState("create");

  const filteredGuides = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return guides;
    return guides.filter((g) => guideSearchText(g).includes(term));
  }, [guides, searchTerm]);

  const selectedGuide = guides.find((g) => g.id === selectedGuideId) ?? guides[0];

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

  function handleSaveEditor({ title, bodyHtml, checkPoints }) {
    if (editorMode === "create") {
      const newGuide = {
        id: `custom-${Date.now()}`,
        label: `Guide ${String(guides.length + 1).padStart(2, "0")}`,
        title,
        bodyHtml,
        checkPoints,
      };
      setGuides((prev) => [...prev, newGuide]);
      setSelectedGuideId(newGuide.id);
    } else {
      setGuides((prev) =>
        prev.map((guide) => (guide.id === selectedGuideId ? { ...guide, title, bodyHtml, checkPoints } : guide))
      );
    }
    setIsEditorOpen(false);
  }

  function handleDeleteGuide() {
    if (guides.length <= 1) {
      window.alert("최소 1개의 포스트는 남아 있어야 합니다.");
      return;
    }
    if (!window.confirm(`"${selectedGuide.title}" 포스트를 정말 삭제하시겠어요?`)) return;

    const remaining = guides.filter((g) => g.id !== selectedGuideId);
    setGuides(remaining);
    setSelectedGuideId(remaining[0].id);
  }

  if (isAdmin && isEditorOpen) {
    return (
      <div className="h-screen w-full flex flex-col bg-surface overflow-hidden">
        <Header />
        <CulturePostEditor
          mode={editorMode}
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

      <main className="flex-1 flex overflow-hidden">
        {/* Narrow Left Sidebar */}
        <aside className="w-[280px] bg-white stitch-border-r flex flex-col p-6 overflow-hidden shrink-0">
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
              className="w-full bg-white border border-dashed border-outline-variant rounded-lg pl-9 pr-3 py-2 text-[13px] focus:border-primary focus:ring-0 transition-all"
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
            {filteredGuides.length === 0 && (
              <p className="px-2 py-6 text-center text-[12px] text-on-surface-variant">검색 결과가 없습니다.</p>
            )}
            {filteredGuides.map((guide) => {
              const isActive = guide.id === selectedGuideId;
              return (
                <div
                  key={guide.id}
                  onClick={() => selectGuide(guide.id)}
                  className={
                    isActive
                      ? "p-4 bg-primary-container/10 border border-primary rounded-xl cursor-pointer"
                      : "p-4 bg-white border border-outline-variant border-dashed rounded-xl cursor-pointer hover:border-primary transition-colors opacity-70"
                  }
                >
                  <p
                    className={
                      isActive
                        ? "text-[11px] text-primary font-bold mb-1 uppercase tracking-wider"
                        : "text-[11px] text-on-surface-variant font-bold mb-1 uppercase tracking-wider"
                    }
                  >
                    {guide.label}
                  </p>
                  <h3 className="text-[15px] font-bold text-on-surface">{guide.title}</h3>
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
        <section className="flex-1 bg-surface-container-lowest relative flex items-center justify-center p-10 overflow-hidden">
          <div className="w-full max-w-[900px] h-full bg-white book-page-shadow rounded-[2rem] border border-outline-variant flex flex-col overflow-hidden">
            {/* Page Header */}
            <div className="px-12 py-8 stitch-border-b flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4 min-w-0">
                <span className="bg-primary-fixed text-on-primary-fixed-variant px-3 py-1 rounded-full text-[12px] font-bold shrink-0">
                  New Joiner Guide
                </span>
                <h2 className="text-[24px] font-bold text-on-surface truncate">{selectedGuide.title}</h2>
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
                  className="ql-editor !p-0 !text-[16px] !leading-[1.8] break-keep text-on-surface-variant"
                  dangerouslySetInnerHTML={{ __html: selectedGuide.bodyHtml }}
                />

                {selectedGuide.checkPoints.length > 0 && (
                  <div className="p-8 bg-surface-container-low border border-dashed border-outline-variant rounded-2xl">
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
          <div className="absolute bottom-10 right-10 flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-dashed border-primary shadow-lg animate-bounce">
            <p className="text-[13px] font-bold text-primary">정독 중이에요!</p>
            <span className="material-symbols-outlined text-primary text-[24px]">pest_control_rodent</span>
          </div>
        </section>
      </main>
    </div>
  );
}
