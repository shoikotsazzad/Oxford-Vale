// One response shape for every server action and route handler.
import type { ZodError } from "zod";

export type ErrorCode = "VALIDATION" | "RATE_LIMITED" | "NOT_FOUND" | "UNAUTHORIZED" | "FORBIDDEN" | "CONFLICT" | "OUT_OF_STOCK" | "SERVER_ERROR";
export type ActionError = { code: ErrorCode; message: string; fields?: Record<string, string> };
export type Result<T = undefined> = { ok: true; data: T } | { ok: false; error: ActionError };

export const ok = <T,>(data: T): Result<T> => ({ ok: true, data });
export const fail = (code: ErrorCode, message: string, fields?: Record<string, string>): { ok: false; error: ActionError } => ({
  ok: false,
  error: { code, message, ...(fields && { fields }) },
});

/** First message per field from a zod error. */
export function fromZod(err: ZodError, message = "Please check the highlighted fields.") {
  const fields: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    fields[key] ??= issue.message;
  }
  return fail("VALIDATION", message, fields);
}

const STATUS: Record<ErrorCode, number> = {
  VALIDATION: 422, RATE_LIMITED: 429, NOT_FOUND: 404, UNAUTHORIZED: 401, FORBIDDEN: 403, CONFLICT: 409, OUT_OF_STOCK: 409, SERVER_ERROR: 500,
};

/** Route handler helper: same shape, matching HTTP status. */
export function toResponse<T>(result: Result<T>) {
  return Response.json(result, { status: result.ok ? 200 : STATUS[result.error.code] });
}
