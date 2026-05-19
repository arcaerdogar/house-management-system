import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as authApi from "@/api/auth";
import { getAccessToken, setAccessToken } from "@/api/client";

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const stored = sessionStorage.getItem("accessToken");
    if (stored) setAccessToken(stored);
    return stored;
  });

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    sessionStorage.setItem("accessToken", data.accessToken);
    setToken(data.accessToken);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    await authApi.register(email, password);
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await authApi.clearSession();
      }
    } finally {
      sessionStorage.removeItem("accessToken");
      authApi.clearSession();
      setToken(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(token ?? getAccessToken()),
      login,
      register,
      logout,
    }),
    [token, login, register, logout]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
