import type { ApiErrorBody } from "@housemate/shared";
import { parseApiErrorMessage, toApiErrorBody } from "./errors";
import { REFRESH_TOKEN_KEY, rotateRefreshToken } from "./session";
import { getAccessToken } from "./tokens";

export { getAccessToken, setAccessToken } from "./tokens";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

let refreshInFlight: Promise<string> | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: ApiErrorBody
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function isAuthPath(path: string): boolean {
  return path.startsWith("/auth/");
}

async function parseErrorResponse(res: Response): Promise<ApiError> {
  let raw: unknown;
  try {
    raw = await res.json();
  } catch {
    raw = undefined;
  }
  const body = toApiErrorBody(raw);
  const message = parseApiErrorMessage(raw, res.statusText || "İstek başarısız");
  return new ApiError(message, res.status, body);
}

async function ensureRefreshed(): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = rotateRefreshToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  options?: { skipRefresh?: boolean }
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  const token = getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (
    res.status === 401 &&
    !options?.skipRefresh &&
    !isAuthPath(path) &&
    localStorage.getItem(REFRESH_TOKEN_KEY)
  ) {
    try {
      await ensureRefreshed();
      return apiFetch<T>(path, init, { skipRefresh: true });
    } catch {
      /* fall through to parse original 401 */
    }
  }

  if (!res.ok) {
    throw await parseErrorResponse(res);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}
