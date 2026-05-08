import type { Viewer } from "@/lib/session";

/**
 * Admin status check.
 *   - demo mode → persona.role === "admin"
 *   - live mode → viewer email matches the comma-separated ADMIN_EMAILS env var
 *
 * Anonymous viewers are never admin. Server-only because it reads process.env.
 */
export function isViewerAdmin(viewer: Viewer): boolean {
  if (viewer.kind === "demo") return viewer.persona.role === "admin";
  if (viewer.kind === "live") {
    const raw = process.env.ADMIN_EMAILS ?? "";
    if (!viewer.email) return false;
    const allow = new Set(
      raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
    );
    return allow.has(viewer.email.toLowerCase());
  }
  return false;
}
