import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as authApi from "@/api/auth";
import { ApiError } from "@/api/client";
import { getAccessToken, setAccessToken } from "@/api/tokens";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/api/session";

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const stored = sessionStorage.getItem(ACCESS_TOKEN_KEY);
      if (stored) {
        setAccessToken(stored);
        if (!cancelled) setToken(stored);
        if (!cancelled) setIsLoading(false);
        return;
      }

      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        try {
          const { access } = await authApi.refreshAccessToken();
          if (!cancelled) setToken(access);
        } catch {
          authApi.clearSession();
        }
      }

      if (!cancelled) setIsLoading(false);
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    setToken(data.access);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const data = await authApi.register(email, password);
    setToken(data.access);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setToken(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(token ?? getAccessToken()),
      isLoading,
      login,
      register,
      logout,
    }),
    [token, isLoading, login, register, logout]
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

export function getAuthErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Beklenmeyen bir hata oluştu";
}
