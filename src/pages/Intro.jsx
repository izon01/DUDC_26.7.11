import { useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import HeroBanner from "../components/HeroBanner";
import IntroHome from "../components/IntroHome";

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

// 사장님 말씀 — kept as data so a change of president is a one-place edit.
const CEO_MESSAGE = {
  greeting: ["임직원 여러분, 반갑습니다.", "대구도시개발공사 사장 이재용입니다."],
  paragraphs: [
    "우리 공사를 움직이는 힘은 각자의 자리에서 책임을 다하는 임직원 여러분에게 있습니다. 여러분이 업무를 수행하며 쌓아 온 지식과 경험은 공사의 소중한 자산이자, 동료의 성장을 돕는 든든한 밑거름입니다.",
    "이번 업무매뉴얼 웹페이지는 이러한 자산을 함께 나누고 활용하기 위해 마련되었습니다. 직원 모두가 알아야 할 공통업무의 기준과 절차, 선배들이 직접 익힌 노하우, 개별업무의 구체적인 수행 방법을 한곳에 담았습니다.",
    "처음 맡는 업무 앞에서는 든든한 길잡이가 되고, 익숙한 업무에서는 더 나은 방법을 찾는 계기가 되기를 바랍니다. 부서와 세대를 넘어 서로의 경험을 나누며 함께 배우는 공간으로 활용해 주시기 바랍니다.",
    "업무매뉴얼은 여러분의 참여로 더욱 충실해집니다. 변화한 업무 절차를 보완하고 자신만의 실무 지혜를 더해, 함께 만들어 가는 살아 있는 매뉴얼로 발전시켜 주십시오.",
    "바쁜 업무 중에도 매뉴얼 작성에 힘써 주신 임직원 여러분께 감사드립니다. 서로의 성장을 돕는 협력과 배움이 대구의 미래 성장동력 창출과 시민에게 더 나은 삶을 제공하는 힘으로 이어지기를 기대합니다.",
  ],
  closing: "감사합니다.",
  signature: { role: "대구도시개발공사 사장", name: "이재용" },
};

const TABS = [
  { key: "home", label: "대구도시개발공사" },
  { key: "mission", label: "미션 및 비전" },
  { key: "business", label: "사업부 안내" },
  { key: "ceo", label: "사장님 말씀" },
];
const DEFAULT_TAB = "home";

export default function Intro() {
  // The tab lives in the URL (?tab=ceo) so reloads, the back button and shared
  // links land on the same tab; the default tab keeps a clean /intro.
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab = TABS.some((tab) => tab.key === requestedTab) ? requestedTab : DEFAULT_TAB;

  function selectTab(key) {
    setSearchParams(key === DEFAULT_TAB ? {} : { tab: key });
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-on-surface">
      <Header />

      <main className="flex-1">
        <div className="max-w-container_max_width mx-auto px-4 md:px-8 lg:px-16 py-8 pb-16">
          {/* Hero Banner */}
          <HeroBanner
            title="일의 기본부터 노하우까지, 필요한 모든 것을 한 곳에서"
            subtitle="함께 알아야 할 공통업무, 선배에게 배우는 노하우, 개별업무 매뉴얼을 담았습니다. 처음 시작하는 업무도, 더 깊이 알고 싶은 업무도 이곳에서 확인하세요."
            imageSrc="/img3.png"
            imageAlt="Welcome"
          />

          {/* 탭 토글 */}
          {/* One pill row from sm up; a 2x2 grid on phones, where four labels
              don't fit in a row and a scrolling row would hide the last tabs. */}
          <div className="mt-16 md:mt-20 flex justify-center">
            <div className="grid grid-cols-2 w-full sm:w-auto sm:inline-flex bg-gray-100 rounded-3xl sm:rounded-full p-1 gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => selectTab(tab.key)}
                  className={`whitespace-nowrap px-3 sm:px-7 py-2.5 sm:py-3 rounded-full font-bold text-sm sm:text-base transition-all ${
                    tab.key === activeTab ? "bg-primary text-white" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "home" ? (
            <IntroHome />
          ) : activeTab === "ceo" ? (
            /* 사장님 말씀: 편지 형식 카드 */
            <section className="mt-12 max-w-3xl mx-auto">
              <article className="bg-white border border-gray-100 rounded-2xl shadow-sm px-6 py-10 sm:px-12 sm:py-14 break-keep">
                <p className="text-sm font-bold text-primary mb-4">사장님 말씀</p>
                <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900 leading-snug">
                  {CEO_MESSAGE.greeting[0]}
                </h2>
                <p className="mt-2 text-base sm:text-lg font-semibold text-gray-700">{CEO_MESSAGE.greeting[1]}</p>

                <div className="mt-8 pt-8 border-t border-gray-100 space-y-6">
                  {CEO_MESSAGE.paragraphs.map((text) => (
                    <p key={text} className="text-[15px] sm:text-base text-gray-700 leading-8">
                      {text}
                    </p>
                  ))}
                  <p className="text-[15px] sm:text-base text-gray-700 leading-8">{CEO_MESSAGE.closing}</p>
                </div>

                <p className="mt-10 text-right text-gray-700">
                  <span className="text-sm sm:text-base">{CEO_MESSAGE.signature.role}</span>{" "}
                  <span className="text-lg sm:text-xl font-extrabold text-gray-900 ml-1">
                    {CEO_MESSAGE.signature.name}
                  </span>
                </p>
              </article>
            </section>
          ) : activeTab === "mission" ? (
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
