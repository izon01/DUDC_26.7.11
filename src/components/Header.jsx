import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthModal from "./AuthModal";

const NAV_ITEMS = [
  { label: "홈", path: "/" },
  { label: "DUDC 소개", path: "/intro" },
  { label: "업무첫걸음", path: "/work-manual" },
  { label: "DUDC 문화", path: "/culture-manual" },
  { label: "첫출근 미션", path: "/mission-checklist" },
  { label: "커뮤니티", path: "/community" },
];

export default function Header() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <header className="shrink-0 w-full z-50 flex justify-between items-center px-margin_page max-w-container_max_width mx-auto bg-surface-container-lowest h-[60px] border-b border-dashed border-outline-variant">
      {/* Brand Logo */}
      <div className="font-headline-md text-headline-md font-bold text-primary">DUDC 로고</div>

      {/* Navigation Links */}
      <nav className="hidden md:flex items-center space-x-10">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={
                isActive
                  ? "text-primary font-bold border-b-2 border-primary pb-1 font-label-sm text-label-sm"
                  : "text-on-surface-variant hover:text-primary transition-colors duration-200 font-label-sm text-label-sm"
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Trailing Action */}
      <div className="flex items-center gap-3">
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

      {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} />}
    </header>
  );
}
