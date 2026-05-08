import { redirect } from "next/navigation";
import { isViewerAdmin } from "@/lib/admin";
import { getViewer } from "@/lib/session";

/**
 * Gate. Anonymous → /login; signed-in but not admin → /dashboard.
 * Admins skip the (needs-profile) onboarding gate (since they don't
 * have a talent/startup profile of their own — they're operating the
 * platform, not posting on it).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (viewer.kind === "anon") redirect("/login");
  if (!isViewerAdmin(viewer)) redirect("/dashboard");
  return <>{children}</>;
}
