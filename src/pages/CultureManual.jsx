import { useState } from "react";
import Header from "../components/Header";

const GUIDES = [
  {
    id: "g1",
    label: "Guide 01",
    title: "사내 예절 안내",
    pages: [
      {
        heading: "인사 예절의 기본",
        icon: "sentiment_satisfied",
        body: "DUDC의 문화는 상호 존중에서 시작됩니다. 아침 출근 시, 회의실 입장 시, 그리고 퇴근 시 가벼운 목례와 인사를 건네보세요. 작은 배려가 즐거운 근무 환경을 만듭니다.",
        checkPoints: [
          "출입구에서 동료를 만나면 밝게 인사하기",
          "엘리베이터 안에서는 조용히 대화하기",
          "회의 시작 5분 전 도착 매너 지키기",
        ],
      },
      { heading: "복장 및 근무 매너", icon: "checkroom", body: "자율 복장을 원칙으로 하되, 외부 미팅이 있는 날은 비즈니스 캐주얼을 권장합니다.", checkPoints: ["외부 미팅 시 단정한 복장 착용", "공용 공간 정숙 유지"] },
      { heading: "회의실 이용 예절", icon: "meeting_room", body: "회의실은 반드시 사전 예약 후 이용하며, 사용 후에는 원상태로 정리해주세요.", checkPoints: ["예약 없이 장시간 점유 금지", "사용 후 화이트보드 지우기"] },
      { heading: "호칭 문화", icon: "badge", body: "DUDC는 직급 대신 '님' 호칭을 사용하는 수평적 커뮤니케이션 문화를 지향합니다.", checkPoints: ["이름 + 님으로 호칭하기", "존댓말 사용을 기본으로 하기"] },
      { heading: "마무리 인사", icon: "waving_hand", body: "사내 예절 안내를 모두 읽어주셔서 감사합니다. 다음 가이드에서 협업 툴 활용법을 안내해 드릴게요.", checkPoints: ["궁금한 점은 지식 베이스에서 검색하기"] },
    ],
  },
  {
    id: "g2",
    label: "Guide 02",
    title: "메일 및 협업 툴 활용",
    pages: [
      { heading: "협업 툴 소개", icon: "forum", body: "DUDC는 '두닥챗'과 'DUDC Space'를 통해 소통하고 업무를 관리합니다. 입사 첫날 계정을 확인해주세요.", checkPoints: ["두닥챗 알림 설정 확인", "DUDC Space 프로필 등록"] },
    ],
  },
  {
    id: "g3",
    label: "Guide 03",
    title: "보고 체계 및 일정 관리",
    pages: [
      { heading: "보고 체계 안내", icon: "schema", body: "모든 업무 보고는 팀장 → 실장 순으로 이루어지며, 주간 업무 계획은 매주 월요일 오전에 공유합니다.", checkPoints: ["주간 보고서 양식 준수", "일정 변경 시 사전 공유"] },
    ],
  },
  {
    id: "g4",
    label: "Guide 04",
    title: "회식 및 소통 문화",
    pages: [
      { heading: "건강한 회식 문화", icon: "celebration", body: "DUDC는 강요 없는 회식 문화를 지향합니다. 참여는 자율이며, 점심 회식도 적극 권장합니다.", checkPoints: ["회식 참여는 자율 선택", "음주 강요 금지"] },
    ],
  },
];

export default function CultureManual() {
  const [selectedGuideId, setSelectedGuideId] = useState(GUIDES[0].id);
  const [pageIndex, setPageIndex] = useState(0);

  const selectedGuide = GUIDES.find((g) => g.id === selectedGuideId) ?? GUIDES[0];
  const currentPage = selectedGuide.pages[pageIndex] ?? selectedGuide.pages[0];
  const totalPages = selectedGuide.pages.length;
  const progressPercent = Math.round(((pageIndex + 1) / totalPages) * 100);

  function selectGuide(id) {
    setSelectedGuideId(id);
    setPageIndex(0);
  }

  function goPrev() {
    setPageIndex((idx) => Math.max(0, idx - 1));
  }

  function goNext() {
    setPageIndex((idx) => Math.min(totalPages - 1, idx + 1));
  }

  return (
    <div className="h-screen w-full flex flex-col bg-surface overflow-hidden">
      <Header />

      <main className="flex-1 flex overflow-hidden">
        {/* Narrow Left Sidebar */}
        <aside className="w-[280px] bg-white stitch-border-r flex flex-col p-6 overflow-hidden shrink-0">
          <div className="flex items-center gap-2 mb-8">
            <span className="material-symbols-outlined text-secondary">menu_book</span>
            <h2 className="font-bold text-[17px] text-on-surface">문화 포스트 목록</h2>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
            {GUIDES.map((guide) => {
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

        {/* Digital Book Reader Area */}
        <section className="flex-1 bg-surface-container-lowest relative flex items-center justify-center p-10 overflow-hidden">
          <button
            onClick={goPrev}
            disabled={pageIndex === 0}
            className="absolute left-8 w-12 h-12 bg-white rounded-full border border-outline-variant shadow-sm flex items-center justify-center hover:scale-105 transition-transform z-10 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <span className="material-symbols-outlined text-on-surface-variant">chevron_left</span>
          </button>
          <button
            onClick={goNext}
            disabled={pageIndex === totalPages - 1}
            className="absolute right-8 w-12 h-12 bg-white rounded-full border border-outline-variant shadow-sm flex items-center justify-center hover:scale-105 transition-transform z-10 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </button>

          <div className="w-full max-w-[840px] h-full bg-white book-page-shadow rounded-[2rem] border border-outline-variant flex flex-col overflow-hidden">
            {/* Page Header */}
            <div className="px-12 py-8 stitch-border-b flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="bg-primary-fixed text-on-primary-fixed-variant px-3 py-1 rounded-full text-[12px] font-bold">
                  New Joiner Guide
                </span>
                <h2 className="text-[24px] font-bold text-on-surface">{selectedGuide.title}</h2>
              </div>
              <div className="text-[14px] text-on-surface-variant font-medium">
                <span className="text-primary font-bold">{String(pageIndex + 1).padStart(2, "0")}</span> /{" "}
                {String(totalPages).padStart(2, "0")}
              </div>
            </div>

            {/* Page Content */}
            <div className="flex-1 px-12 py-10 overflow-y-auto custom-scrollbar">
              <div className="max-w-2xl mx-auto space-y-10">
                <div>
                  <h3 className="text-[20px] font-bold text-primary flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined">{currentPage.icon}</span>
                    {currentPage.heading}
                  </h3>
                  <p className="text-[16px] leading-relaxed text-on-surface-variant">{currentPage.body}</p>
                </div>

                <div className="p-8 bg-surface-container-low border border-dashed border-outline-variant rounded-2xl">
                  <h4 className="font-bold text-[16px] text-on-surface mb-4">Check Points:</h4>
                  <ul className="space-y-4">
                    {currentPage.checkPoints.map((point) => (
                      <li key={point} className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary">check_circle</span>
                        <span className="text-[15px] text-on-surface-variant">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="aspect-video rounded-2xl border border-outline-variant bg-primary-fixed/50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[48px]">groups</span>
                  </div>
                  <div className="aspect-video rounded-2xl border border-outline-variant bg-secondary-fixed/50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-secondary text-[48px]">apartment</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Page Footer */}
            <div className="px-12 py-6 bg-surface-container-lowest stitch-border-t flex items-center justify-between">
              <button
                onClick={goPrev}
                disabled={pageIndex === 0}
                className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors group disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">
                  arrow_back
                </span>
                <span className="text-[14px] font-bold">이전 페이지</span>
              </button>

              <div className="flex-1 max-w-[300px] h-[4px] bg-surface-container-high rounded-full relative mx-10">
                <div
                  className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
                <div
                  className="absolute -translate-x-1/2 -top-6 w-8 h-8 transition-all duration-500"
                  style={{ left: `${progressPercent}%` }}
                >
                  <span className="material-symbols-outlined text-primary text-[24px]">pets</span>
                </div>
              </div>

              <button
                onClick={goNext}
                disabled={pageIndex === totalPages - 1}
                className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-full font-bold hover:bg-opacity-90 active:scale-95 transition-all group disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="text-[14px]">다음 페이지</span>
                <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>

          {/* Floating Mascot */}
          <div className="absolute bottom-10 right-10 flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-dashed border-primary shadow-lg animate-bounce">
            <p className="text-[13px] font-bold text-primary">{pageIndex + 1}페이지 정독 중!</p>
            <span className="material-symbols-outlined text-primary text-[24px]">pest_control_rodent</span>
          </div>
        </section>
      </main>

      {/* Footer Bar */}
      <footer className="h-[40px] bg-white stitch-border-t px-10 flex items-center justify-between z-50 shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-[12px] font-bold text-on-surface">DUDC 신입사원을 위한 Portal</span>
        </div>
      </footer>
    </div>
  );
}
