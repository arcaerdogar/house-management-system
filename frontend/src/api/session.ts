import { setAccessToken } from "./tokens";

export const DEVICE_ID_KEY = "housemate_device_id";
export const REFRESH_TOKEN_KEY = "refreshToken";
export const ACCESS_TOKEN_KEY = "accessToken";
export const ACTIVE_HOUSE_KEY = "housemate_active_house";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function persistDeviceId(deviceId: string) {
  localStorage.setItem(DEVICE_ID_KEY, deviceId);
}

export interface AuthSession {
  refreshToken: string;
  deviceId: string;
  expiresAt?: string;
}

export function persistSession(access: string, session: AuthSession) {
  setAccessToken(access);
  sessionStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  persistDeviceId(session.deviceId);
}

export function clearSession() {
  setAccessToken(null);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ACTIVE_HOUSE_KEY);
}

interface RefreshResponse {
  access: string;
  newRaw: string;
}

/** Low-level refresh — used by api client on 401 (avoids circular import). */
export async function rotateRefreshToken(): Promise<string> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) throw new Error("Oturum bulunamadı");

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      refreshToken,
      deviceId: getDeviceId(),
    }),
  });

  if (!res.ok) {
    clearSession();
    throw new Error("Oturum yenilenemedi");
  }

  const data = (await res.json()) as RefreshResponse;
  setAccessToken(data.access);
  sessionStorage.setItem(ACCESS_TOKEN_KEY, data.access);
  localStorage.setItem(REFRESH_TOKEN_KEY, data.newRaw);
  return data.access;
}
