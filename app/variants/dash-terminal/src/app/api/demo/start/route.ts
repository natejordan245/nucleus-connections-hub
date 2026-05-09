import { NextResponse, type NextRequest } from "next/server";
import { DEMO_COOKIE, MODE_COOKIE } from "@/lib/mode";
import { DEMO_ACTIVE_COOKIE } from "@/lib/demo/cookie";
import { SLIDES } from "@/lib/demo/slides";

const ONE_DAY = 60 * 60 * 24;

/**
 * Boots the canonical demo deck:
 *   - flips the app into demo mode
 *   - signs the viewer in as Sarah Chen (the deck's protagonist)
 *   - flags the demo as active so DemoSlideBar renders
 *   - lands them on slide 1
 */
export function GET(request: NextRequest) {
  return start(request);
}
export function POST(request: NextRequest) {
  return start(request);
}

function start(request: NextRequest) {
  const url = new URL(request.url);
  const target = SLIDES[0].path;
  const res = NextResponse.redirect(new URL(target, url.origin), { status: 303 });
  const cookieOpts = {
    httpOnly: false as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_DAY,
    path: "/",
  };
  res.cookies.set(MODE_COOKIE, "demo", cookieOpts);
  res.cookies.set(DEMO_COOKIE, "tal-sarah", { ...cookieOpts, httpOnly: true });
  res.cookies.set(DEMO_ACTIVE_COOKIE, "1", cookieOpts);
  return res;
}
