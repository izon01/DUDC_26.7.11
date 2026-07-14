import Header from "../components/Header";
import HeroBanner from "../components/HeroBanner";

const CORE_VALUES = [
  {
    icon: "verified_user",
    title: "신뢰 (Trust)",
    desc: "서로를 믿고 투명하게 소통하며 약속을 지키는 정직한 문화",
    iconBg: "bg-primary-fixed",
    iconColor: "text-primary",
    hoverBorder: "hover:border-primary/50",
  },
  {
    icon: "lightbulb",
    title: "혁신 (Innovation)",
    desc: "도전을 두려워하지 않고 끊임없이 변화하며 새로운 가치 창출",
    iconBg: "bg-secondary-fixed",
    iconColor: "text-secondary",
    hoverBorder: "hover:border-secondary/50",
  },
  {
    icon: "forum",
    title: "소통 (Communication)",
    desc: "다양성을 존중하고 열린 마음으로 더 나은 해답을 찾아가는 소통",
    iconBg: "bg-tertiary-fixed",
    iconColor: "text-tertiary",
    hoverBorder: "hover:border-tertiary/50",
  },
];

export default function Intro() {
  return (
    <div className="h-screen w-full flex flex-col bg-background text-on-surface overflow-hidden">
      <Header />

      <main className="flex-1 overflow-y-auto">
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

          <div className="mt-10 md:mt-12 flex flex-col md:flex-row items-center relative">
            {/* Left Half: Welcome Message */}
            <div className="w-full md:w-1/2 flex flex-col justify-center md:pr-12">
              <div className="mb-4 inline-flex">
                <span className="bg-secondary-container px-3 py-1 rounded-full font-label-sm text-label-sm text-on-secondary-container">
                  CEO Welcome Message
                </span>
              </div>
              <div className="relative p-8 bg-white rounded-2xl border-2 border-outline-variant/40">
                <p className="font-body-lg text-body-lg text-on-surface-variant mb-6 italic leading-relaxed">
                  "우리는 매일 세상을 더 연결하는 꿈을 꿉니다. 당신의 열정과 창의력이 우리와 만나 더 큰 결실을
                  맺기를 기대합니다."
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary p-0.5 flex items-center justify-center bg-primary-fixed">
                    <span className="material-symbols-outlined text-primary text-[32px]">person</span>
                  </div>
                  <div>
                    <p className="font-label-sm text-label-sm font-bold text-on-surface">김다정 대표이사</p>
                    <p className="font-label-sm text-label-sm text-outline">DUDC CEO &amp; Founder</p>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex gap-4">
                <button className="bg-primary text-on-primary px-8 py-3 rounded-xl font-body-md text-body-md hover:shadow-lg active:scale-95 transition-all">
                  온보딩 시작하기
                </button>
              </div>
            </div>

            {/* Vertical Divider (desktop only) */}
            <div className="hidden md:block stitch-line-v absolute left-1/2 -translate-x-1/2 h-4/5 top-1/2 -translate-y-1/2 opacity-30" />

            {/* Right Half: Core Values */}
            <div className="w-full md:w-1/2 flex flex-col justify-center gap-6 md:pl-12 mt-8 md:mt-0">
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface">우리의 핵심 가치</h2>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                  DUDC가 일하는 방식과 지향하는 미래입니다.
                </p>
              </div>

              {CORE_VALUES.map((value) => (
                <div
                  key={value.title}
                  className={`bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 transition-colors ${value.hoverBorder}`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 ${value.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                      <span
                        className={`material-symbols-outlined ${value.iconColor}`}
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {value.icon}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-on-surface">{value.title}</h3>
                      <p className="text-sm text-on-surface-variant mt-1">{value.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
