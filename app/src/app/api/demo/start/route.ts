import { NextResponse, type NextRequest } from "next/server";
import { DEMO_COOKIE, MODE_COOKIE } from "@/lib/mode";
import { DEMO_ACTIVE_COOKIE } from "@/lib/demo/cookie";

const ONE_DAY = 60 * 60 * 24;

/**
 * Drops the demo cookies and lands the viewer on the live dashboard as Zac
 * Hales. Called from the slideshow handoff page after the pitch deck.
 */
export function GET(request: NextRequest) {
  return start(request);
}
export function POST(request: NextRequest) {
  return start(request);
}

function start(request: NextRequest) {
  const url = new URL(request.url);
  const target = url.searchParams.get("to") ?? "/dashboard";
  const res = NextResponse.redirect(new URL(target, url.origin), { status: 303 });
  const cookieOpts = {
    httpOnly: false as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_DAY,
    path: "/",
  };
  res.cookies.set(MODE_COOKIE, "demo", cookieOpts);
  res.cookies.set(DEMO_COOKIE, "tal-zac", { ...cookieOpts, httpOnly: true });
  res.cookies.set(DEMO_ACTIVE_COOKIE, "1", cookieOpts);
  return res;
}
