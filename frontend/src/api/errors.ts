import type { ApiErrorBody } from "@housemate/shared";

/** Backend may return ApiErrorBody or legacy HttpError `{ Error, message }`. */
type ErrorPayload = ApiErrorBody & {
  Error?: string;
  message?: string;
};

export function parseApiErrorMessage(
  body: unknown,
  fallback: string
): string {
  if (!body || typeof body !== "object") return fallback;
  const payload = body as ErrorPayload;
  if (typeof payload.message === "string" && payload.message) {
    return payload.message;
  }
  if (typeof payload.error === "string" && payload.error) {
    return payload.error;
  }
  if (typeof payload.Error === "string" && payload.Error) {
    return payload.Error;
  }
  return fallback;
}

export function toApiErrorBody(body: unknown): ApiErrorBody | undefined {
  if (!body || typeof body !== "object") return undefined;
  const payload = body as ErrorPayload;
  const error =
    payload.error ??
    payload.message ??
    (typeof payload.Error === "string" ? payload.Error : undefined);
  if (!error) return undefined;
  return { error, code: payload.code, details: payload.details };
}
