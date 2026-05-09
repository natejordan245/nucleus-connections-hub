import { redirect } from "next/navigation";
import type { HeaderViewer } from "@/components/AppShell";
import { isViewerAdmin } from "@/lib/admin";
import { getDataStore } from "@/lib/data";
import { getViewer, type Viewer } from "@/lib/session";

/**
 * Returns the viewer's id as it would appear in the data layer (`talent.id` /
 * `startup.id` in demo mode, or `auth.users.id` in live mode), and the viewer
 * object itself. Redirects anon users to /login.
 */
export async function requireViewer(): Promise<{ viewer: Exclude<Viewer, { kind: "anon" }>; viewerId: string }> {
  const viewer = await getViewer();
  if (viewer.kind === "anon") redirect("/login");
  const viewerId = viewer.kind === "demo" ? viewer.persona.id : viewer.userId;
  return { viewer, viewerId };
}

export async function maybeViewer(): Promise<{ viewer: Viewer; viewerId: string | null }> {
  const viewer = await getViewer();
  const viewerId =
    viewer.kind === "demo" ? viewer.persona.id : viewer.kind === "live" ? viewer.userId : null;
  return { viewer, viewerId };
}

/**
 * Builds the data the top header needs to render profile + admin links.
 * Returns null if the viewer is anonymous.
 */
export async function getHeaderViewer(): Promise<HeaderViewer | null> {
  const { viewer, viewerId } = await maybeViewer();
  if (!viewerId || viewer.kind === "anon") return null;
  const isAdmin = isViewerAdmin(viewer);
  const store = getDataStore();
  const [talent, startup] = await Promise.all([
    store.getTalent(viewerId),
    store.getStartup(viewerId),
  ]);
  if (talent) {
    return {
      id: viewerId,
      name: talent.name,
      photoUrl: talent.photoUrl,
      profileHref: `/profile/talent/${talent.id}`,
      isAdmin,
    };
  }
  if (startup) {
    return {
      id: viewerId,
      name: startup.name,
      photoUrl: startup.logoUrl,
      profileHref: `/profile/startup/${startup.id}`,
      isAdmin,
    };
  }
  return {
    id: viewerId,
    name:
      viewer.kind === "demo"
        ? viewer.persona.name
        : viewer.email?.split("@")[0] ?? "You",
    photoUrl: undefined,
    profileHref: null,
    isAdmin,
  };
}
