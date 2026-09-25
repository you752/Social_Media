// The backend wraps responses in a SuccessResponse envelope, but the exact
// shape of the envelope (and of `data`) is not fully documented. This file
// isolates that assumption so it is easy to adjust in one place if the real
// backend shape differs.

export interface BackendEnvelope<T = unknown> {
  message?: string;
  data?: T;
  // Some endpoints may return the payload directly without an envelope.
  [key: string]: unknown;
}

/**
 * Normalizes a backend response so callers can reliably access the
 * "actual" payload regardless of whether the backend wrapped it in
 * `{ message, data }` or returned it directly.
 *
 * ASSUMPTION: if a `data` key exists on the response body, it holds the
 * real payload. Otherwise the whole body is treated as the payload.
 * Adjust this function if the backend real envelope differs.
 */
export function unwrap<T = unknown>(body: unknown): T {
  if (
    body &&
    typeof body === "object" &&
    "data" in (body as Record<string, unknown>)
  ) {
    return (body as BackendEnvelope<T>).data as T;
  }
  return body as T;
}

export interface ApiErrorShape {
  message?: string;
  error?: string;
  [key: string]: unknown;
}
