import { redirect } from "next/navigation";
import { getDataStore } from "@/lib/data";
import { requireViewer } from "@/lib/viewer";

/**
 * Canonical "my profile" route. Resolves the viewer's profile and redirects:
 *   no profile → /onboard
 *   candidate  → /profile/candidate/<id>
 *   business   → /profile/business/<id>
 *   mentor     → /profile/mentor/<id>
 *   investor   → /profile/investor/<id>
 */
export default async function MyProfilePage() {
  const { viewerId } = await requireViewer();
  const store = getDataStore();
  const [candidate, business, mentor, investor] = await Promise.all([
    store.getCandidate(viewerId),
    store.getBusiness(viewerId),
    store.getMentor(viewerId),
    store.getInvestor(viewerId),
  ]);

  if (candidate) redirect(`/profile/candidate/${candidate.id}`);
  if (business) redirect(`/profile/business/${business.id}`);
  if (mentor) redirect(`/profile/mentor/${mentor.id}`);
  if (investor) redirect(`/profile/investor/${investor.id}`);
  redirect("/onboard");
}
