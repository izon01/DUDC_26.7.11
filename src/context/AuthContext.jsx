import { createContext, useCallback, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);
const STORAGE_KEY = "dudc_auth";

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: null, user: null };
    const parsed = JSON.parse(raw);
    return { token: parsed.token ?? null, user: parsed.user ?? null };
  } catch {
    return { token: null, user: null };
  }
}

async function parseJsonSafely(res) {
  try {
    return await res.json();
  } catch {
    return {};
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

  return (
    <AuthContext.Provider
      value={{
        token: auth.token,
        user: auth.user,
        isAuthenticated: Boolean(auth.token),
        login,
        signup,
        logout,
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
