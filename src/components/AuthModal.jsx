import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const initialFields = { email: "", password: "", name: "", affiliation: "" };

export default function AuthModal({ onClose }) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState("login");
  const [fields, setFields] = useState(initialFields);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(key, value) {
    setFields((prev) => ({ ...prev, [key]: value }));
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
