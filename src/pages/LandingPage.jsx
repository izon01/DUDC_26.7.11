import { useState } from "react";
import AuthModal from "../components/AuthModal";

const MASCOTS = [
  {
    image: "/img3.png",
    nameKo: "청키",
    nameEn: "chungky",
    details: [
      { label: "동물", value: "상어" },
      { label: "직업", value: "기획담당" },
      { label: "상징", value: "주거복지 / 기획" },
      { label: "성격", value: "열정이 넘치고 다정함" },
      { label: "MBTI", value: "ENFP (재기발랄한 활동가)" },
    ],
  },
  {
    image: "/img4.png",
    nameKo: "아두",
    nameEn: "adu",
    details: [
      { label: "동물", value: "두더지" },
      { label: "직업", value: "개발담당" },
      { label: "상징", value: "측량 / 설계 / 공사" },
      { label: "성격", value: "만드는 것을 좋아함" },
      { label: "MBTI", value: "ISTJ (청렴결백 논리주의자)" },
    ],
  },
  {
    image: "/img5.png",
    nameKo: "라미",
    nameEn: "rami",
    details: [
      { label: "동물", value: "오리" },
      { label: "직업", value: "홍보담당" },
      { label: "상징", value: "소통 / 홍보" },
      { label: "성격", value: "책임감이 강함" },
      { label: "MBTI", value: "ESFJ (사교적인 외교관)" },
    ],
  },
];

export default function LandingPage() {
  const [authMode, setAuthMode] = useState(null);

  return (
    <div className="h-screen w-full flex flex-col bg-[#fafbfc] overflow-hidden">
      {/* Header */}
      <header className="shrink-0 w-full flex items-center justify-between px-4 md:px-8 lg:px-16 py-6 max-w-[1280px] mx-auto">
        <img src="/img1.png" alt="DUDC" className="h-10 w-auto object-contain" />
        <div className="flex items-center gap-6">
          <button
            onClick={() => setAuthMode("login")}
            className="text-on-surface-variant font-bold text-[15px] hover:text-primary transition-colors"
          >
            로그인
          </button>
          <button
            onClick={() => setAuthMode("signup")}
            className="px-5 py-2.5 rounded-full bg-primary text-white font-bold text-[14px] hover:opacity-90 active:scale-95 transition-all"
          >
            회원가입
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-start lg:items-center overflow-y-auto lg:overflow-hidden py-8 lg:py-0 px-4 md:px-8 lg:px-16 max-w-[1280px] mx-auto w-full">
        <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 lg:gap-16 items-center">
          {/* Left: Hero copy */}
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary-fixed text-primary text-[13px] font-bold mb-6">
              DUDC Onboard Hub
            </span>
            <h1 className="text-[44px] lg:text-[52px] leading-[1.2] font-extrabold text-on-surface mb-6">
              신입의 첫 출근을
              <br />
              <span className="text-primary">허브 하나로</span>
            </h1>
            <p className="text-on-surface-variant text-[17px] leading-relaxed mb-8 max-w-[480px]">
              업무 가이드·조직적응 매뉴얼·사내 지식이 모이는 공간. 질문은 AI 비서 아두가 받아드려요.
            </p>
            <div className="flex items-center gap-6">
              <button
                onClick={() => setAuthMode("login")}
                className="px-6 py-3 rounded-full bg-primary text-white font-bold text-[15px] hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20"
              >
                로그인
              </button>
            </div>
          </div>

          {/* Right: Mascot cards */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-5">
            {MASCOTS.map((mascot) => (
              <div
                key={mascot.nameKo}
                className="w-[200px] bg-white rounded-2xl shadow-md border border-outline-variant/20 flex flex-col items-center p-6"
              >
                <img src={mascot.image} alt={mascot.nameKo} className="w-28 h-28 object-contain mb-4" />
                <p className="font-bold text-on-surface text-[20px]">{mascot.nameKo}</p>
                <p className="text-outline text-[12px] mb-4">{mascot.nameEn}</p>
                <div className="w-full space-y-2">
                  {mascot.details.map((detail) => {
                    const isMbti = detail.label === "MBTI";
                    const spaceIdx = isMbti ? detail.value.indexOf(" ") : -1;
                    const mbtiCode = isMbti ? detail.value.slice(0, spaceIdx) : "";
                    const mbtiDesc = isMbti ? detail.value.slice(spaceIdx + 1) : "";
                    return (
                      <div
                        key={detail.label}
                        className="flex items-start justify-start gap-2 border-b border-outline-variant/10 pb-2 text-[12px]"
                      >
                        <span className="text-primary text-[9px] shrink-0 mt-[3px]">▶</span>
                        <span className="text-outline shrink-0 w-14">{detail.label}</span>
                        {isMbti ? (
                          <span className="text-on-surface font-medium flex-1 flex flex-col text-right">
                            <span>{mbtiCode}</span>
                            <span className="break-keep">{mbtiDesc}</span>
                          </span>
                        ) : (
                          <span className="text-on-surface font-medium text-left break-keep flex-1">
                            {detail.value}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {authMode && <AuthModal initialMode={authMode} onClose={() => setAuthMode(null)} />}
    </div>
  );
}
