import { redirect } from "next/navigation";
import { getDataStore } from "@/lib/data";
import { requireViewer } from "@/lib/viewer";

/**
 * Gate for routes that require a completed profile. Anonymous → /login;
 * signed-in but no profile row yet → /onboard. The /onboard tree itself sits
 * one level up in the (app) group so the redirect can't recurse.
 */
export default async function NeedsProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { viewerId } = await requireViewer();
  const kind = await getDataStore().getProfileKind(viewerId);
  if (!kind) {
    redirect("/onboard");
  }
  return <>{children}</>;
}
