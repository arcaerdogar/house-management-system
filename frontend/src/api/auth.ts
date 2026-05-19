import { apiFetch } from "./client";
import {
  clearSession,
  getDeviceId,
  persistSession,
  REFRESH_TOKEN_KEY,
  rotateRefreshToken,
  type AuthSession,
} from "./session";

interface LoginResponse {
  user: { userId: string; email: string };
  access: string;
  session: AuthSession;
}

interface RegisterResponse {
  user: { id: string; email: string };
  access: string;
  session: AuthSession;
}

export async function login(email: string, password: string) {
  const data = await apiFetch<LoginResponse>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password, deviceId: getDeviceId() }),
    },
    { skipRefresh: true }
  );
  persistSession(data.access, data.session);
  return data;
}

export async function register(email: string, password: string) {
  const data = await apiFetch<RegisterResponse>(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
    { skipRefresh: true }
  );
  persistSession(data.access, data.session);
  return data;
}

export async function refreshAccessToken() {
  const access = await rotateRefreshToken();
  return { access };
}

export async function logout() {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (refreshToken) {
    try {
      await apiFetch(
        "/auth/logout",
        {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        },
        { skipRefresh: true }
      );
    } catch {
      /* revoke locally even if server call fails */
    }
  }
  clearSession();
}

export { clearSession } from "./session";
