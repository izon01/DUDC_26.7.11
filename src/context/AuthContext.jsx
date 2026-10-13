import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { parseJsonSafely } from "../utils/http";

const AuthContext = createContext(null);
const STORAGE_KEY = "dudc_auth";

// Reads the JWT's `exp` (seconds) without verifying it — the server is the
// real authority; this only lets the client notice a stale token early.
function getTokenExpiryMs(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const expiresAt = getTokenExpiryMs(token);
  return expiresAt !== null && expiresAt <= Date.now();
}

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: null, user: null };
    const parsed = JSON.parse(raw);
    if (!parsed.token || isTokenExpired(parsed.token)) return { token: null, user: null };
    return { token: parsed.token, user: parsed.user ?? null };
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth);

  useEffect(() => {
    if (auth.token && auth.user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [auth]);

  // Logs out the moment the token expires while the tab is open, and
  // re-checks when the tab regains focus (timers are throttled/paused in
  // background tabs and while the computer sleeps).
  useEffect(() => {
    if (!auth.token) return;

    function expireSession() {
      setAuth({ token: null, user: null });
      window.alert("로그인 시간이 만료되었습니다. 다시 로그인해 주세요.");
    }

    const expiresAt = getTokenExpiryMs(auth.token);
    if (expiresAt === null) return;

    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
      expireSession();
      return;
    }

    const timer = setTimeout(expireSession, remaining);
    function checkOnFocus() {
      if (document.visibilityState === "visible" && isTokenExpired(auth.token)) expireSession();
    }
    document.addEventListener("visibilitychange", checkOnFocus);
    window.addEventListener("focus", checkOnFocus);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", checkOnFocus);
      window.removeEventListener("focus", checkOnFocus);
    };
  }, [auth.token]);

  const login = useCallback(async (email, password) => {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await parseJsonSafely(res);
    if (!res.ok) {
      throw new Error(data.message || "로그인에 실패했습니다.");
    }
    setAuth({ token: data.token, user: data.user });
    return data.user;
  }, []);

  const signup = useCallback(async ({ email, name, affiliation, password }) => {
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, affiliation, password }),
    });
    const data = await parseJsonSafely(res);
    if (!res.ok) {
      throw new Error(data.message || "회원가입에 실패했습니다.");
    }
    return data.user;
  }, []);

  const logout = useCallback(() => {
    setAuth({ token: null, user: null });
  }, []);

  const updateProfile = useCallback(
    async ({ affiliation, password }) => {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ affiliation, password }),
      });
      const data = await parseJsonSafely(res);
      if (!res.ok) {
        throw new Error(data.message || "프로필 수정에 실패했습니다.");
      }
      setAuth((prev) => ({ ...prev, user: data.user }));
      return data.user;
    },
    [auth.token]
  );

  return (
    <AuthContext.Provider
      value={{
        token: auth.token,
        user: auth.user,
        isAuthenticated: Boolean(auth.token),
        login,
        signup,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
