import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { APP_MODE, DEMO_COOKIE } from "@/lib/mode";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  if (APP_MODE === "demo") {
    cookies().delete(DEMO_COOKIE);
  } else {
    try {
      const sb = getSupabaseServerClient();
      await sb.auth.signOut();
    } catch {
      // env not configured — nothing to sign out of
    }
  }
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
