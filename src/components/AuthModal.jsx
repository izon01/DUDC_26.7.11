import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DASHBOARD_PATH = "/work-manual";

const initialFields = { email: "", password: "", name: "", affiliation: "" };

// 개발 중 빠른 테스트용 — 프로덕션 빌드에는 포함되지 않습니다.
const DEV_TEST_ACCOUNTS = [
  { label: "관리자 테스트", email: "admin@dudc.local", password: "Admin1234!" },
  { label: "일반 유저 테스트", email: "user@dudc.local", password: "User1234!" },
];

export default function AuthModal({ onClose, initialMode = "login" }) {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState(initialMode);
  const [fields, setFields] = useState(initialFields);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(key, value) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function fillTestAccount(account) {
    setError("");
    setInfoMessage("");
    setFields((prev) => ({ ...prev, email: account.email, password: account.password }));
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setInfoMessage("");
    setFields((prev) => ({ ...initialFields, email: prev.email }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await login(fields.email, fields.password);
        onClose();
        navigate(DASHBOARD_PATH, { replace: true });
      } else {
        if (fields.password.length < 8) {
          throw new Error("비밀번호는 8자 이상이어야 합니다.");
        }
        await signup(fields);
        setInfoMessage("가입이 완료되었습니다. 로그인해주세요.");
        setMode("login");
        setFields((prev) => ({ ...initialFields, email: prev.email }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl border-2 border-dashed border-outline-variant shadow-xl overflow-hidden">
        <div className="px-8 py-6 border-b-2 border-dashed border-outline-variant flex items-center justify-between bg-primary-fixed/30">
          <h2 className="text-headline-md font-headline-md text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">account_circle</span>
            {mode === "login" ? "로그인" : "회원가입"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {/* Mode Switch */}
        <div className="flex gap-2 px-8 pt-6">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={
              mode === "login"
                ? "flex-1 py-2.5 rounded-full bg-primary text-on-primary font-bold text-label-sm transition-all"
                : "flex-1 py-2.5 rounded-full border-2 border-dashed border-outline-variant text-on-surface-variant font-bold text-label-sm hover:bg-surface-container-low transition-all"
            }
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={
              mode === "signup"
                ? "flex-1 py-2.5 rounded-full bg-primary text-on-primary font-bold text-label-sm transition-all"
                : "flex-1 py-2.5 rounded-full border-2 border-dashed border-outline-variant text-on-surface-variant font-bold text-label-sm hover:bg-surface-container-low transition-all"
            }
          >
            회원가입
          </button>
        </div>

        {import.meta.env.DEV && mode === "login" && (
          <div className="mx-8 mt-4 px-4 py-3 rounded-xl bg-secondary-container/30 border-2 border-dashed border-secondary/40">
            <p className="text-label-sm font-bold text-secondary mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">construction</span>
              개발용 테스트 계정 (배포 시 자동으로 사라짐)
            </p>
            <div className="flex flex-col gap-1.5">
              {DEV_TEST_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => fillTestAccount(account)}
                  className="text-left px-3 py-2 rounded-lg bg-white border border-dashed border-outline-variant hover:border-primary transition-colors text-[12px]"
                >
                  <span className="font-bold text-on-surface">{account.label}</span>
                  <span className="text-on-surface-variant"> — {account.email} / {account.password}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
          {infoMessage && (
            <div className="px-4 py-2.5 rounded-lg bg-primary/5 border border-dashed border-primary/30 text-label-sm text-primary">
              {infoMessage}
            </div>
          )}
          {error && (
            <div className="px-4 py-2.5 rounded-lg bg-error/5 border border-dashed border-error/30 text-label-sm text-error">
              {error}
            </div>
          )}

          {mode === "signup" && (
            <>
              <div>
                <label className="text-label-sm font-label-sm text-on-surface-variant mb-1.5 block" htmlFor="auth-name">
                  이름
                </label>
                <input
                  id="auth-name"
                  type="text"
                  required
                  value={fields.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="홍길동"
                  className="w-full bg-surface-container-lowest border-2 border-dashed border-outline-variant rounded-xl focus:border-primary focus:ring-0 text-body-md px-4 py-2.5 transition-all"
                />
              </div>
              <div>
                <label
                  className="text-label-sm font-label-sm text-on-surface-variant mb-1.5 block"
                  htmlFor="auth-affiliation"
                >
                  소속
                </label>
                <input
                  id="auth-affiliation"
                  type="text"
                  required
                  value={fields.affiliation}
                  onChange={(e) => updateField("affiliation", e.target.value)}
                  placeholder="개발팀"
                  className="w-full bg-surface-container-lowest border-2 border-dashed border-outline-variant rounded-xl focus:border-primary focus:ring-0 text-body-md px-4 py-2.5 transition-all"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-label-sm font-label-sm text-on-surface-variant mb-1.5 block" htmlFor="auth-email">
              이메일
            </label>
            <input
              id="auth-email"
              type="email"
              required
              value={fields.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="you@dudc.com"
              className="w-full bg-surface-container-lowest border-2 border-dashed border-outline-variant rounded-xl focus:border-primary focus:ring-0 text-body-md px-4 py-2.5 transition-all"
            />
          </div>

          <div>
            <label className="text-label-sm font-label-sm text-on-surface-variant mb-1.5 block" htmlFor="auth-password">
              비밀번호
            </label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={8}
              value={fields.password}
              onChange={(e) => updateField("password", e.target.value)}
              placeholder="8자 이상 입력해주세요"
              className="w-full bg-surface-container-lowest border-2 border-dashed border-outline-variant rounded-xl focus:border-primary focus:ring-0 text-body-md px-4 py-2.5 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "처리 중..." : mode === "login" ? "로그인" : "가입하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
