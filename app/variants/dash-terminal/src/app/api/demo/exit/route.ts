import { NextResponse, type NextRequest } from "next/server";
import { DEMO_COOKIE, MODE_COOKIE } from "@/lib/mode";
import { DEMO_ACTIVE_COOKIE } from "@/lib/demo/cookie";

const ONE_MONTH = 60 * 60 * 24 * 30;

/**
 * Clears the demo-active flag. Optional `?to=login` flips the app back to
 * live mode and lands the user on /login — the "Try it for real" off-ramp
 * at the end of the deck.
 */
function exit(request: NextRequest) {
  const url = new URL(request.url);
  const to = url.searchParams.get("to");
  const target = to === "login" ? "/login" : "/dashboard";

  const res = NextResponse.redirect(new URL(target, url.origin), { status: 303 });
  res.cookies.delete(DEMO_ACTIVE_COOKIE);

  if (to === "login") {
    // Off-ramp: switch to live mode + drop the demo persona so the next
    // signup/sign-in is a real account, not the demo persona.
    res.cookies.set(MODE_COOKIE, "live", {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: ONE_MONTH,
      path: "/",
    });
    res.cookies.delete(DEMO_COOKIE);
  }

  return res;
}

export function POST(request: NextRequest) {
  return exit(request);
}
export function GET(request: NextRequest) {
  return exit(request);
}
