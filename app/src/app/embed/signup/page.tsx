import { headers } from "next/headers";
import { EmbedSignupFlow } from "./EmbedSignupFlow";

export const dynamic = "force-dynamic";

function resolveOriginBaseUrl(): string {
  const h = headers();
  const explicit =
    h.get("x-forwarded-host") ?? h.get("host") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (!explicit) return "";
  // Allow NEXT_PUBLIC_SITE_URL to be a full URL; otherwise build it.
  if (/^https?:\/\//i.test(explicit)) return explicit.replace(/\/$/, "");
  return `${proto}://${explicit}`.replace(/\/$/, "");
}

export default function EmbedSignupPage() {
  const originBaseUrl = resolveOriginBaseUrl();
  return <EmbedSignupFlow originBaseUrl={originBaseUrl} />;
}
