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
  const store = getDataStore();
  const [candidate, business, mentor, investor] = await Promise.all([
    store.getCandidate(viewerId),
    store.getBusiness(viewerId),
    store.getMentor(viewerId),
    store.getInvestor(viewerId),
  ]);
  if (!candidate && !business && !mentor && !investor) {
    redirect("/onboard");
  }
  return <>{children}</>;
}
