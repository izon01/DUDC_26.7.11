import { useState } from "react";
import Header from "../components/Header";

const TABS = [
  {
    key: "day1",
    label: "1일차",
    items: [
      { title: "사내 메일 및 메신저 계정 생성", desc: "IT 지원팀의 안내에 따라 업무용 공식 계정을 활성화하세요." },
      { title: "인사팀 서류 제출", desc: "학위증명서, 통장사본 등 필요 서류를 ERP에 업로드하세요." },
      { title: "팀원들과 정식 인사 및 티타임", desc: "소속 부서원들과 간단한 인사를 나누고 팀 문화를 파악합니다." },
      { title: "사무기기 세팅 및 소모품 수령", desc: "노트북, 모니터 등 지급받은 기기가 정상 작동하는지 확인하세요." },
    ],
  },
  {
    key: "week1",
    label: "1주차",
    items: [
      { title: "부서별 협업 프로세스 숙지", desc: "팀 내 업무 분담과 보고 체계를 파악하세요." },
      { title: "사내 필수 교육 이수", desc: "정보보안 및 윤리 교육을 온라인으로 수강합니다." },
      { title: "멘토와 첫 면담", desc: "배정된 멘토와 1:1 미팅을 통해 궁금한 점을 해소하세요." },
      { title: "주간 팀 회의 참석", desc: "주간 팀 회의에 참석하여 업무 흐름을 익힙니다." },
    ],
  },
  {
    key: "month1",
    label: "1개월차",
    items: [
      { title: "첫 프로젝트 참여", desc: "담당 업무 또는 프로젝트에 본격적으로 투입됩니다." },
      { title: "수습 평가 면담 준비", desc: "1개월 성과를 정리하고 팀장과 면담을 진행하세요." },
      { title: "사내 동호회 가입", desc: "관심 있는 동호회에 가입해 새로운 동료들과 교류해보세요." },
      { title: "복리후생 제도 활용", desc: "건강검진, 자기계발비 등 제공되는 복지를 확인하고 신청하세요." },
    ],
  },
];

const initialChecked = Object.fromEntries(TABS.map((tab) => [tab.key, tab.items.map(() => false)]));

export default function MissionChecklist() {
  const [activeTabKey, setActiveTabKey] = useState(TABS[0].key);
  const [checkedMap, setCheckedMap] = useState(initialChecked);

  const activeTabIndex = TABS.findIndex((tab) => tab.key === activeTabKey);
  const activeTab = TABS[activeTabIndex];
  const activeChecked = checkedMap[activeTabKey];
  const doneCount = activeChecked.filter(Boolean).length;
  const progressPercent = Math.round((doneCount / activeTab.items.length) * 100);

  function toggleItem(itemIndex) {
    setCheckedMap((prev) => ({
      ...prev,
      [activeTabKey]: prev[activeTabKey].map((val, idx) => (idx === itemIndex ? !val : val)),
    }));
  }

  return (
    <div className="h-screen w-full flex flex-col bg-background text-on-surface overflow-hidden font-body-md">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-[#F9FAFB] py-gutter px-4 md:px-8">
        {/* Header Section */}
        <div className="w-full mb-8 flex flex-col items-center">
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-label-sm font-label-sm">
              Step 01. 환영합니다
            </span>
            <span className="material-symbols-outlined text-[28px] text-primary">pets</span>
          </div>
          <h1 className="text-headline-lg font-headline-lg text-on-surface text-center">온보딩 체크리스트</h1>
          <p className="text-on-surface-variant text-body-md mt-2 text-center">
            DUDC의 일원이 되신 것을 축하드립니다. 차근차근 첫 단추를 꿰어보세요.
          </p>
        </div>

        {/* Checklist Card */}
        <div className="w-full max-w-3xl bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm flex flex-col h-[520px]">
          {/* Tabs */}
          <div className="flex border-b border-outline-variant">
            {TABS.map((tab) => {
              const isActive = tab.key === activeTabKey;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTabKey(tab.key)}
                  className={
                    isActive
                      ? "flex-1 py-4 text-primary font-bold border-b-2 border-primary text-body-md transition-all bg-primary/5 active-tab"
                      : "flex-1 py-4 text-on-surface-variant font-medium text-body-md hover:bg-surface transition-all"
                  }
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* List Content */}
          <div className="flex-1 p-8 overflow-y-auto custom-scroll relative">
            <div className="absolute left-[47px] top-12 bottom-12 w-px stitch-border-v opacity-30" />
            <div className="space-y-6 relative z-10">
              {activeTab.items.map((item, idx) => {
                const isChecked = activeChecked[idx];
                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-6 group p-2 rounded-xl hover:bg-surface-container-low transition-all"
                  >
                    <button
                      onClick={() => toggleItem(idx)}
                      className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-primary-container shrink-0"
                    >
                      <span
                        className={
                          isChecked
                            ? "material-symbols-outlined text-primary-container font-bold"
                            : "material-symbols-outlined text-primary-container font-bold hidden"
                        }
                        style={{ fontSize: "20px" }}
                      >
                        check
                      </span>
                    </button>
                    <div className="flex-1">
                      <h3
                        className={
                          isChecked
                            ? "text-body-lg font-bold text-outline line-through"
                            : "text-body-lg font-bold text-on-surface"
                        }
                      >
                        {item.title}
                      </h3>
                      <p className="text-label-sm text-on-surface-variant">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pagination/Progress Footer */}
          <div className="p-6 border-t border-outline-variant flex flex-wrap gap-3 justify-between items-center bg-surface-container-lowest">
            <div className="flex items-center gap-3">
              <span className="text-label-sm text-on-surface-variant font-medium">진행률 {progressPercent}%</span>
              <div className="w-28 sm:w-48 h-2 bg-surface-container-highest rounded-full overflow-hidden relative">
                <div
                  className="absolute inset-0 h-full bg-primary-container rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {TABS.map((tab, idx) => (
                <span
                  key={tab.key}
                  className={
                    idx === activeTabIndex
                      ? "w-2.5 h-2.5 rounded-full bg-primary-container"
                      : "w-2.5 h-2.5 rounded-full bg-surface-container-highest"
                  }
                />
              ))}
            </div>
            <button
              onClick={() => setActiveTabKey(TABS[Math.min(activeTabIndex + 1, TABS.length - 1)].key)}
              disabled={activeTabIndex === TABS.length - 1}
              className="bg-primary text-white px-6 py-2 rounded-xl text-label-sm font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              다음 단계
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
