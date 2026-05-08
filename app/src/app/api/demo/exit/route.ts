import { NextResponse, type NextRequest } from "next/server";
import { DEMO_ACTIVE_COOKIE } from "@/lib/demo/cookie";

/** Clears the demo-active flag. App-mode cookie is left alone. */
export function POST(request: NextRequest) {
  const res = NextResponse.redirect(new URL("/dashboard", request.url), { status: 303 });
  res.cookies.delete(DEMO_ACTIVE_COOKIE);
  return res;
}
export function GET(request: NextRequest) {
  return POST(request);
}
