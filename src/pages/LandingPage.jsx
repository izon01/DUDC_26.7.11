import { useState } from "react";
import AuthModal from "../components/AuthModal";

const MASCOTS = [
  { name: "청키", role: "학습 가이드 · ENFP", emoji: "🦈" },
  { name: "아두", role: "지식 비서 · ISTJ", emoji: "🦫" },
  { name: "라미", role: "소통 호스트 · ESFJ", emoji: "🦆" },
];

export default function LandingPage() {
  const [authMode, setAuthMode] = useState(null);

  return (
    <div className="h-screen w-full flex flex-col bg-[#fafbfc] overflow-hidden">
      {/* Header */}
      <header className="shrink-0 w-full flex items-center justify-between px-4 md:px-8 lg:px-16 py-6 max-w-[1280px] mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-[15px]">D</span>
          </div>
          <span className="font-bold text-on-surface text-[18px]">DUDC 로고</span>
        </div>
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
      <main className="flex-1 flex items-center overflow-y-auto lg:overflow-hidden py-8 lg:py-0 px-4 md:px-8 lg:px-16 max-w-[1280px] mx-auto w-full">
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
          <div className="flex flex-wrap justify-center lg:justify-start gap-4 lg:gap-5">
            {MASCOTS.map((mascot) => (
              <div
                key={mascot.name}
                className="w-[110px] sm:w-[140px] bg-white rounded-3xl shadow-xl shadow-black/5 border border-outline-variant/20 flex flex-col items-center py-8 px-4"
              >
                <div className="w-16 h-16 flex items-center justify-center text-[40px] mb-4">
                  {mascot.emoji}
                </div>
                <p className="font-bold text-on-surface text-[16px]">{mascot.name}</p>
                <p className="text-outline text-[11px] mt-1 text-center leading-snug">{mascot.role}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 w-full flex items-center justify-between px-4 md:px-8 lg:px-16 py-6 max-w-[1280px] mx-auto text-[12px] text-outline">
        <span>© Daegu Urban Development Corporation</span>
        <span>Onboard Hub · Mockup Preview</span>
      </footer>

      {authMode && <AuthModal initialMode={authMode} onClose={() => setAuthMode(null)} />}
    </div>
  );
}
