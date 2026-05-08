"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { MODE_COOKIE, getAppMode } from "@/lib/mode";

const ONE_MONTH = 60 * 60 * 24 * 30;

/** Flip the active app mode cookie. Server action — invoked from the header. */
export async function toggleAppMode() {
  const next = getAppMode() === "live" ? "demo" : "live";
  cookies().set({
    name: MODE_COOKIE,
    value: next,
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_MONTH,
    path: "/",
  });
  revalidatePath("/", "layout");
}
