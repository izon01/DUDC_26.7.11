import { useState } from "react";
import Header from "../components/Header";
import HeroBanner from "../components/HeroBanner";

const CORE_VALUE_PILLS = [
  { label: "전문성", desc: "도시개발의 미래를 이루는", color: "bg-blue-900" },
  { label: "상생", desc: "시민과 함께 누리는", color: "bg-blue-700" },
  { label: "신뢰", desc: "공정과 책임으로 실현하는", color: "bg-teal-700" },
  { label: "혁신", desc: "자율과 책임으로 지속되는", color: "bg-teal-600" },
];

const STRATEGIC_DIRECTIONS = [
  { no: "01", title: "미래산업 기반 성장동력 확보" },
  { no: "02", title: "주거안정 기반 시민행복 실현" },
  { no: "03", title: "ESG기반 신뢰문화 구축" },
  { no: "04", title: "자율성 기반 경영혁신 실현" },
];

const BUSINESS_UNITS = [
  {
    title: "🚜 택지개발사업",
    desc: "시민들이 쾌적하고 안정적으로 거주할 수 있는 대규모 주택 건설 용지를 체계적으로 조성하고 공급합니다.",
  },
  {
    title: "🏭 산업단지사업",
    desc: "지역 경제 활성화와 우수 기업 유치를 위해 기반 시설이 완비된 맞춤형 산업단지를 개발합니다.",
  },
  {
    title: "🏙️ 도시개발사업",
    desc: "대구의 균형 발전을 목표로, 주거·상업·문화 인프라가 융합된 자족형 미래 신도시를 기획하고 조성합니다.",
  },
  {
    title: "🌐 스마트도시사업",
    desc: "최첨단 정보통신기술(ICT)을 도시 공간에 접목하여, 시민의 삶이 더욱 편리하고 안전해지는 스마트시티를 구축합니다.",
  },
  {
    title: "🌳 공원조성사업",
    desc: "도심 속에서도 자연을 누리며 삶의 질을 높일 수 있도록, 친환경적인 휴식 공간과 테마 공원을 조성합니다.",
  },
  {
    title: "⚖️ 보상사업",
    desc: "공익사업 추진 시 편입되는 토지와 지장물에 대해, 투명하고 정당한 기준을 바탕으로 신속한 손실 보상 업무를 수행합니다.",
  },
  {
    title: "🏢 공영주택건설",
    desc: "무주택 서민의 내 집 마련과 주거 안정을 위해, 튼튼하고 합리적인 가격의 고품질 공공주택을 직접 건설합니다.",
  },
  {
    title: "✨ 주거환경개선",
    desc: "기반 시설이 열악하고 낡은 노후 주거 지역을 체계적으로 정비하여, 안전하고 쾌적한 정주 여건으로 탈바꿈시킵니다.",
  },
  {
    title: "💖 주거복지",
    desc: "청년, 신혼부부, 취약계층을 위한 맞춤형 임대주택을 제공하여 든든한 주거 안전망을 실현합니다.",
  },
  {
    title: "🏊 유니버시아드레포츠센터",
    desc: "수영, 골프, 헬스 등 다양한 체육 시설과 프로그램을 운영하여 대구 시민의 건강 증진과 건전한 여가 생활을 지원합니다.",
  },
];

const TABS = [
  { key: "mission", label: "미션 및 비전" },
  { key: "business", label: "사업부 안내" },
];

export default function Intro() {
  const [activeTab, setActiveTab] = useState("mission");

  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-on-surface">
      <Header />

      <main className="flex-1">
        <div className="max-w-container_max_width mx-auto px-4 md:px-8 lg:px-16 py-8 pb-16">
          {/* Hero Banner */}
          <HeroBanner
            title={
              <>
                <span className="text-primary">DUDC</span>와 함께,
                <br />
                새로운 시작을
                <br />
                더 큰 성장으로 이어가세요.
              </>
            }
            subtitle="당신의 첫걸음부터 업무 적응까지, DUDC가 함께하겠습니다."
            imageSrc="/img3.png"
            imageAlt="Welcome"
          />

          {/* 탭 토글 */}
          <div className="mt-16 md:mt-20 flex justify-center">
            <div className="inline-flex bg-gray-100 rounded-full p-1 gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={
                    tab.key === activeTab
                      ? "px-8 py-3 rounded-full bg-primary text-white font-bold text-base transition-all"
                      : "px-8 py-3 rounded-full text-gray-500 font-bold text-base hover:text-gray-700 transition-all"
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "mission" ? (
            /* 미션 및 비전: 전체 너비 */
            <section className="mt-12 max-w-5xl mx-auto">
              {/* Mission & Vision text boxes */}
              <div className="flex flex-col gap-12 mb-14">
                <div className="border-l-[6px] border-r-[6px] border-gray-100 px-12 py-8 text-center">
                  <p className="text-xl font-bold text-blue-800 mb-3">• 미션 •</p>
                  <p className="text-gray-700 text-lg font-extrabold whitespace-nowrap">
                    산업단지 조성·주택건설 공급 등 도시개발사업을 통하여 대구시 지역발전과 시민생활의 안정에 이바지한다.
                  </p>
                </div>
                <div className="border-l-[6px] border-r-[6px] border-gray-100 px-12 py-8 text-center">
                  <p className="text-xl font-bold text-teal-600 mb-3">• 비전 •</p>
                  <p className="text-gray-900 text-2xl font-extrabold mb-3 break-keep leading-relaxed">
                    시민 행복과 공간 미래가치를 창출하는 도시혁신 주도 공기업
                  </p>
                  <p className="text-gray-600 text-sm break-keep leading-relaxed">
                    시민의 삶의 질과 지속 가능한 미래가치를 실현하기 위한 혁신적 도시개발을 주도적으로 기획하고
                    완수하는 공기업의 위상을 지향합니다.
                  </p>
                </div>
              </div>

              {/* 핵심가치 pills: 1x4, 넉넉한 크기 */}
              <div className="mb-14">
                <div
                  className="w-[400px] max-w-full h-16 bg-gradient-to-t from-gray-300 to-transparent drop-shadow-md mx-auto mb-2"
                  style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
                />
                <h3 className="text-center font-bold text-xl text-gray-900 mb-6">핵심가치</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {CORE_VALUE_PILLS.map((value) => (
                    <div
                      key={value.label}
                      className={`${value.color} rounded-full text-white shadow-md flex flex-col items-center justify-center text-center px-6 py-8`}
                    >
                      <span className="text-sm opacity-90 break-keep mb-1">{value.desc}</span>
                      <span className="font-bold text-xl">{value.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 전략방향 circles: 1x4, 넉넉한 크기 */}
              <div className="bg-gray-50 rounded-full border border-gray-100 shadow-sm px-12 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 justify-items-center">
                {STRATEGIC_DIRECTIONS.map((strategy) => (
                  <div
                    key={strategy.no}
                    className="aspect-square w-40 rounded-full bg-white border-2 border-blue-500 shadow-md flex flex-col items-center justify-center text-center p-4 gap-1"
                  >
                    <span className="text-primary font-bold text-sm">전략방향 {strategy.no}</span>
                    <span className="text-gray-700 text-sm font-semibold break-keep leading-snug">
                      {strategy.title}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            /* 사업부 안내: 전체 너비 확장 그리드 */
            <section className="mt-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {BUSINESS_UNITS.map((unit) => (
                  <div
                    key={unit.title}
                    className="h-full bg-white border border-gray-100 rounded-xl shadow-sm p-6 hover:-translate-y-1 hover:shadow-md transition-all"
                  >
                    <h3 className="font-bold text-blue-800 text-base tracking-tight mb-2">{unit.title}</h3>
                    <p className="text-gray-600 text-sm break-keep leading-relaxed">{unit.desc}</p>
                  </div>
                ))}

                {/* Wide closing card spanning the last row's empty 2 columns */}
                <div className="h-full lg:col-span-2 bg-blue-50/50 border border-gray-100 rounded-xl shadow-sm p-6 hover:-translate-y-1 hover:shadow-md transition-all">
                  <h3 className="font-bold text-blue-800 text-base tracking-tight mb-2">대구도시개발공사</h3>
                  <p className="text-gray-600 text-sm break-keep leading-relaxed">
                    시민 행복과 공간 미래가치를 창출하는 도시혁신 주도 공기업으로서, 대구시의 지속 가능한 발전과
                    시민의 더 나은 삶을 기획하고 완성합니다.
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
