import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, AUTH_TOKEN_KEY } from "../lib/api";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
  }, []);

  const applyAuth = useCallback((payload) => {
    localStorage.setItem(AUTH_TOKEN_KEY, payload.access_token);
    setUser(payload.user);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    navigate("/login", { replace: true });
  }, [clearSession, navigate]);

  const signup = useCallback(
    async (email, password) => {
      const response = await api.post("/auth/signup", { email, password });
      applyAuth(response.data);
      return response.data.user;
    },
    [applyAuth],
  );

  const login = useCallback(
    async (email, password) => {
      const response = await api.post("/auth/login", { email, password });
      applyAuth(response.data);
      return response.data.user;
    },
    [applyAuth],
  );

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get("/auth/me");
      setUser(response.data.user);
    } catch {
      clearSession();
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      signup,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, signup, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
