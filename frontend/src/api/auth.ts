import { apiFetch, setAccessToken } from "./client";

const DEVICE_ID_KEY = "housemate_device_id";

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export async function login(email: string, password: string) {
  const data = await apiFetch<AuthTokens>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, deviceId: getDeviceId() }),
  });
  setAccessToken(data.accessToken);
  if (data.refreshToken) {
    localStorage.setItem("refreshToken", data.refreshToken);
  }
  return data;
}

export async function register(email: string, password: string) {
  return apiFetch<{ message?: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) throw new Error("No refresh token");
  const data = await apiFetch<AuthTokens>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken, deviceId: getDeviceId() }),
  });
  setAccessToken(data.accessToken);
  if (data.refreshToken) {
    localStorage.setItem("refreshToken", data.refreshToken);
  }
  return data;
}

export function clearSession() {
  setAccessToken(null);
  localStorage.removeItem("refreshToken");
}
