import { NextResponse } from "next/server";

export function ok<T>(body: T, init?: ResponseInit) {
  return NextResponse.json(body, init);
}

export function fail(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function badRequest(message: string) {
  return fail(400, "bad_request", message);
}

export function notFound(message: string) {
  return fail(404, "not_found", message);
}

export function serverError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return fail(500, "server_error", message);
}
