import { NextResponse, type NextRequest } from "next/server";
import { MODE_COOKIE } from "@/lib/mode";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Mode cookie wins; otherwise env default.
  const cookieMode = request.cookies.get(MODE_COOKIE)?.value;
  const mode =
    cookieMode === "live" || cookieMode === "demo"
      ? cookieMode
      : process.env.NEXT_PUBLIC_APP_MODE === "live"
        ? "live"
        : "demo";

  if (mode !== "live") return NextResponse.next();
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
