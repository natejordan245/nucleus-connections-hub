import { cookies } from "next/headers";

export const DEMO_ACTIVE_COOKIE = "nch_demo_active";

export function isDemoActive(): boolean {
  try {
    return cookies().get(DEMO_ACTIVE_COOKIE)?.value === "1";
  } catch {
    return false;
  }
}
