import Header from "../components/Header";
import HeroBanner from "../components/HeroBanner";

const RECENT_MANUALS = [
  { icon: "corporate_fare", title: "사내 보안 규정 안내", meta: "보안 관리팀 · 2시간 전" },
  { icon: "laptop_mac", title: "협업 툴 사용 가이드", meta: "IT 지원팀 · 1일 전" },
  { icon: "payments", title: "복리후생 및 휴가 신청", meta: "인사관리팀 · 3일 전" },
];

const CULTURE_POSTS = [
  { tag: "#사내동호회", title: "퇴근 후 함께하는 러닝 크루, 'DUDC 런닝' 모집 중", meta: "24.05.21 · 조회수 128" },
  { tag: "#인터뷰", title: "선배가 들려주는 DUDC에서의 3년, 그리고 성장", meta: "24.05.18 · 조회수 456" },
  { tag: "#간담회", title: "CEO와 함께하는 타운홀 미팅 현장 스케치", meta: "24.05.15 · 조회수 892" },
];

const CHECKLIST_PROGRESS = 65;

export default function Home() {
  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden">
      <Header />

      <main className="flex-1 w-full flex flex-col items-center overflow-y-auto lg:overflow-hidden">
        <div className="w-full max-w-container_max_width min-h-full lg:h-full flex flex-col gap-6 py-6 px-4 md:px-8 lg:px-16 box-border lg:overflow-hidden">
          {/* Hero Banner */}
          <HeroBanner
            title={
              <>
                신입사원 여러분을
                <br />
                진심으로 환영합니다!
              </>
            }
            subtitle="DUDC의 새로운 구성원이 되신 것을 축하드립니다. 여러분의 첫걸음이 빛날 수 있도록 돕겠습니다."
            imageSrc="/img2.png"
            imageAlt="배너 이미지"
          />

          {/* Recent Work Manuals */}
          <section className="w-full bg-[#ffdbc7]/30 rounded-xl border-2 border-outline-variant p-6 shrink-0">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">menu_book</span>
                <h2 className="font-headline-md text-headline-md text-on-surface">최근 업무 매뉴얼</h2>
              </div>
              <button className="text-label-sm font-label-sm text-secondary hover:underline transition-all">
                전체보기
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {RECENT_MANUALS.map((manual) => (
                <div
                  key={manual.title}
                  className="bg-surface-container-lowest p-4 rounded-lg border-2 border-outline-variant flex items-center gap-4 hover:shadow-sm transition-shadow cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-on-secondary-container">{manual.icon}</span>
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">{manual.title}</p>
                    <p className="text-label-sm font-label-sm text-on-surface-variant">{manual.meta}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Bottom Layout: Culture & Checklist */}
          <section className="flex flex-col md:flex-row gap-6 grow lg:overflow-hidden pb-4 lg:min-h-0">
            {/* Culture Posts Card */}
            <div className="w-full md:w-1/2 flex-1 lg:min-h-0 bg-surface-container-lowest rounded-xl border-2 border-outline-variant flex flex-col p-6 lg:overflow-hidden">
              <div className="flex justify-between items-center mb-4 border-b-2 border-outline-variant pb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary">theater_comedy</span>
                  <h2 className="font-headline-md text-headline-md text-on-surface">최근 문화 포스트</h2>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant cursor-pointer">add</span>
              </div>
              <div className="grow overflow-y-auto custom-scroll space-y-4 pr-2">
                {CULTURE_POSTS.map((post, idx) => (
                  <div key={post.title}>
                    {idx > 0 && <div className="border-t-2 border-outline-variant mb-4" />}
                    <div className="group cursor-pointer">
                      <p className="text-label-sm font-label-sm text-tertiary mb-1">{post.tag}</p>
                      <h3 className="font-bold text-on-surface group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-label-sm font-label-sm text-on-surface-variant mt-1">{post.meta}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Checklist Card */}
            <div className="w-full md:w-1/2 flex-1 lg:min-h-0 bg-surface-container-lowest rounded-xl border-2 border-outline-variant flex flex-col p-6 lg:overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">task_alt</span>
                  <h2 className="font-headline-md text-headline-md text-on-surface">체크리스트 진행도</h2>
                </div>
                <span className="text-primary font-bold">{CHECKLIST_PROGRESS}%</span>
              </div>

              {/* Progress Bar */}
              <div className="relative w-full h-8 mb-8 flex items-center">
                <div className="w-full h-[6px] bg-surface-container rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-primary transition-all duration-1000"
                    style={{ width: `${CHECKLIST_PROGRESS}%` }}
                  />
                </div>
                <div className="absolute" style={{ left: `calc(${CHECKLIST_PROGRESS}% - 15px)` }}>
                  <div className="w-8 h-8 -mt-6 flex flex-col items-center">
                    <span className="material-symbols-outlined text-[22px] text-primary animate-bounce">pets</span>
                  </div>
                </div>
              </div>

              {/* Checklist Items */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg border-2 border-outline-variant/30">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                  <span className="text-on-surface font-medium line-through opacity-60 text-body-md">
                    기본 사내 IT 계정 생성 완료
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg border-2 border-outline-variant/30">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                  <span className="text-on-surface font-medium line-through opacity-60 text-body-md">
                    온보딩 환영 패키지 수령
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-primary shadow-sm">
                  <div className="w-5 h-5 border-2 border-primary rounded-full" />
                  <span className="text-on-surface font-bold text-body-md">부서장 오리엔테이션 참석 (D-1)</span>
                  <span className="ml-auto text-primary text-[10px] font-bold px-1.5 py-0.5 bg-primary/10 rounded uppercase">
                    In Progress
                  </span>
                </div>
              </div>

              <button className="mt-auto w-full py-3 bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2">
                다음 미션 확인하기
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
