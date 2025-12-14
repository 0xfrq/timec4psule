import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  });

  // Simpan ke localStorage 1x dari sini saja
  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  const value = useMemo(() => ({
    token,
    user,
    isLogin: !!token,
    setAuth: ({ token, user }) => {
      if (token !== undefined) setToken(token);
      if (user !== undefined) setUser(user);
    },
    logout: () => {
      setToken("");
      setUser(null);
    },
  }), [token, user]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession() harus dipakai di dalam <SessionProvider>");
  return ctx;
}
