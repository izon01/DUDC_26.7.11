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
  { title: "택지개발사업", desc: "쾌적하고 안정적인 대규모 주택 건설 용지 조성" },
  { title: "산업단지사업", desc: "기업 유치 및 지역 경제 활성화를 위한 맞춤형 산단 개발" },
  { title: "도시개발사업", desc: "주거·상업·문화가 융합된 자족형 미래 신도시 조성" },
  { title: "스마트도시사업", desc: "첨단 ICT 기술을 접목한 편리하고 안전한 스마트시티 구축" },
  { title: "공원조성사업", desc: "시민의 삶의 질을 높이는 친환경 휴식 공간 조성" },
  { title: "보상사업", desc: "공익사업 추진을 위한 투명하고 신속한 손실 보상 업무" },
  { title: "공영주택건설", desc: "무주택 서민의 주거 안정을 위한 고품질 공공주택 건설" },
  { title: "주거환경개선", desc: "노후 주거 지역을 정비하여 안전한 정주 여건 조성" },
  { title: "주거복지", desc: "청년 및 취약계층을 위한 맞춤형 임대주택 제공" },
  { title: "유니버시아드레포츠센터", desc: "대구 시민 건강 증진을 위한 종합 체육 시설 운영" },
];

export default function Intro() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-on-surface">
      <Header />

      <main className="flex-1">
        <div className="max-w-container_max_width mx-auto px-4 md:px-8 lg:px-16 py-8 pb-16">
          {/* Hero Banner */}
          <HeroBanner
            title={
              <>
                <span className="text-primary">DUDC</span>의 새로운 가족이
                <br />
                되신 것을 환영합니다
              </>
            }
            imageSrc="/img3.png"
            imageAlt="Welcome"
          />

          {/* 좌: 미션/비전 다이어그램, 우: 사업부 안내 */}
          <div className="mt-16 md:mt-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* 왼쪽 단: 미션 및 비전 */}
            <section>
              <h2 className="text-2xl md:text-3xl font-extrabold text-center text-gray-900 mb-8">
                미션 및 비전
              </h2>

              {/* Mission & Vision text boxes */}
              <div className="flex flex-col gap-4 mb-8">
                <div className="border-l-4 border-r-4 border-gray-200 px-6 py-5 text-center">
                  <p className="text-xs font-bold text-primary tracking-[0.2em] mb-2">MISSION</p>
                  <p className="text-gray-700 text-sm md:text-base break-keep leading-relaxed">
                    산업단지 조성·주택건설 공급 등 도시개발사업을 통하여 대구시 지역발전과 시민생활의 안정에
                    이바지한다.
                  </p>
                </div>
                <div className="border-l-4 border-r-4 border-gray-200 px-6 py-5 text-center">
                  <p className="text-xs font-bold text-primary tracking-[0.2em] mb-2">VISION</p>
                  <p className="font-bold text-gray-900 text-base md:text-lg mb-2 break-keep">
                    시민 행복과 공간 미래가치를 창출하는 도시혁신 주도 공기업
                  </p>
                  <p className="text-gray-600 text-sm break-keep leading-relaxed">
                    시민의 삶의 질과 지속 가능한 미래가치를 실현하기 위한 혁신적 도시개발을 주도적으로 기획하고
                    완수하는 공기업의 위상을 지향합니다.
                  </p>
                </div>
              </div>

              {/* 핵심가치 pills: 2x2 */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {CORE_VALUE_PILLS.map((value) => (
                  <div
                    key={value.label}
                    className={`${value.color} rounded-full text-white flex flex-col items-center justify-center text-center px-4 py-6`}
                  >
                    <span className="font-bold text-base mb-1">{value.label}</span>
                    <span className="text-[11px] opacity-90 break-keep">{value.desc}</span>
                  </div>
                ))}
              </div>

              {/* 전략방향 circles: 2x2 */}
              <div className="bg-gray-50 rounded-[2rem] p-6 grid grid-cols-2 gap-4 justify-items-center">
                {STRATEGIC_DIRECTIONS.map((strategy) => (
                  <div
                    key={strategy.no}
                    className="aspect-square w-28 md:w-32 rounded-full bg-white border-2 border-blue-500 flex flex-col items-center justify-center text-center p-3 gap-1"
                  >
                    <span className="text-primary font-bold text-xs">전략방향 {strategy.no}</span>
                    <span className="text-gray-700 text-xs font-semibold break-keep leading-snug">
                      {strategy.title}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* 오른쪽 단: 사업부 안내 */}
            <section>
              <h2 className="text-2xl md:text-3xl font-extrabold text-center text-gray-900 mb-8">
                사업부 안내
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {BUSINESS_UNITS.map((unit) => (
                  <div
                    key={unit.title}
                    className="h-full bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-center hover:-translate-y-1 hover:shadow-lg transition-all"
                  >
                    <h3 className="font-bold text-blue-800 text-base mb-1.5">{unit.title}</h3>
                    <p className="text-gray-600 text-sm break-keep leading-relaxed">{unit.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
