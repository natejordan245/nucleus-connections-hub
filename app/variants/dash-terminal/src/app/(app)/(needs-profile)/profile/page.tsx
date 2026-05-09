import { redirect } from "next/navigation";
import { getDataStore } from "@/lib/data";
import { requireViewer } from "@/lib/viewer";

/**
 * Canonical "my profile" route. Resolves the viewer's profile and redirects:
 *   no profile → /onboard
 *   talent     → /profile/talent/<id>
 *   startup    → /profile/startup/<id>
 */
export default async function MyProfilePage() {
  const { viewerId } = await requireViewer();
  const store = getDataStore();
  const [talent, startup] = await Promise.all([
    store.getTalent(viewerId),
    store.getStartup(viewerId),
  ]);

  if (talent) redirect(`/profile/talent/${talent.id}`);
  if (startup) redirect(`/profile/startup/${startup.id}`);
  redirect("/onboard");
}
