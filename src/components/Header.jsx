import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthModal from "./AuthModal";

const NAV_ITEMS = [
  { label: "홈", path: "/" },
  { label: "DUDC소개", path: "/intro" },
  { label: "업무첫걸음", path: "/work-manual" },
  { label: "DUDC문화", path: "/culture-manual" },
  { label: "첫출근미션", path: "/mission-checklist" },
  { label: "커뮤니티", path: "/community" },
];

export default function Header() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 shrink-0 w-full bg-surface-container-lowest h-[72px] border-b border-outline-variant">
      <div className="h-full max-w-[1600px] mx-auto flex items-center justify-between px-4 sm:px-6 md:px-16">
        {/* Left: Brand Logo */}
        <Link to="/" className="shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
          <img src="/img1.png" alt="DUDC" className="h-10 w-auto object-contain" />
        </Link>

        {/* Center: Navigation Links (desktop/tablet only) */}
        <nav className="flex-1 hidden md:flex items-center justify-center gap-8 lg:gap-10">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={
                  isActive
                    ? "text-primary font-bold border-b-2 border-primary pb-1 text-base whitespace-nowrap"
                    : "text-on-surface-variant hover:text-primary transition-colors duration-200 font-medium text-base whitespace-nowrap"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: User (desktop/tablet) + Hamburger (mobile) */}
        <div className="shrink-0 flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <span className="flex items-center gap-1.5 text-label-sm font-label-sm text-on-surface-variant">
                  <span className="font-bold text-on-surface">{user.name}</span>님
                  {user.role === "admin" && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">
                      Admin
                    </span>
                  )}
                </span>
                <button
                  onClick={logout}
                  className="px-4 py-1.5 rounded-full border border-outline-variant text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container-low transition-colors active:scale-95"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-1.5 rounded-full border border-primary text-primary font-label-sm text-label-sm hover:bg-primary-fixed transition-colors active:scale-95"
              >
                로그인
              </button>
            )}
          </div>

          <button
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg text-on-surface hover:bg-surface-container-low transition-colors"
            aria-label={isMobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
          >
            <span className="material-symbols-outlined">{isMobileMenuOpen ? "close" : "menu"}</span>
          </button>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-[72px] left-0 w-full bg-surface-container-lowest border-b border-outline-variant shadow-lg z-40">
          <nav className="flex flex-col px-4 sm:px-6 py-3">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={
                    isActive
                      ? "px-2 py-3 rounded-lg text-primary font-bold text-base bg-primary/5"
                      : "px-2 py-3 rounded-lg text-on-surface-variant font-medium text-base hover:bg-surface-container-low transition-colors"
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-outline-variant px-4 sm:px-6 py-4">
            {user ? (
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-label-sm font-label-sm text-on-surface-variant">
                  <span className="font-bold text-on-surface">{user.name}</span>님
                  {user.role === "admin" && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">
                      Admin
                    </span>
                  )}
                </span>
                <button
                  onClick={() => {
                    logout();
                    closeMobileMenu();
                  }}
                  className="px-4 py-1.5 rounded-full border border-outline-variant text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container-low transition-colors active:scale-95 shrink-0"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsAuthModalOpen(true);
                  closeMobileMenu();
                }}
                className="w-full px-4 py-2 rounded-full border border-primary text-primary font-label-sm text-label-sm hover:bg-primary-fixed transition-colors active:scale-95"
              >
                로그인
              </button>
            )}
          </div>
        </div>
      )}

      {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} />}
    </header>
  );
}
