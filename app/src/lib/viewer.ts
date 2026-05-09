import { redirect } from "next/navigation";
import type { HeaderViewer } from "@/components/AppShell";
import { isViewerAdmin } from "@/lib/admin";
import { getDataStore } from "@/lib/data";
import type { ProfileKind } from "@/lib/data/types";
import { getViewer, type Viewer } from "@/lib/session";

/**
 * Returns the viewer's id as it would appear in the data layer (the profile
 * row id in demo mode, or `auth.users.id` in live mode), and the viewer
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
 * Builds the data the top header needs to render the profile/sign-in slot.
 * Returns null if the viewer is anonymous.
 */
export async function getHeaderViewer(): Promise<HeaderViewer | null> {
  const { viewer, viewerId } = await maybeViewer();
  if (!viewerId || viewer.kind === "anon") return null;
  const isAdmin = isViewerAdmin(viewer);
  const store = getDataStore();
  const [candidate, business, mentor, investor] = await Promise.all([
    store.getCandidate(viewerId),
    store.getBusiness(viewerId),
    store.getMentor(viewerId),
    store.getInvestor(viewerId),
  ]);
  if (candidate) {
    return {
      id: viewerId,
      name: candidate.name,
      photoUrl: candidate.photoUrl,
      profileHref: `/profile/candidate/${candidate.id}`,
      isAdmin,
    };
  }
  if (business) {
    return {
      id: viewerId,
      name: business.name,
      photoUrl: business.logoUrl,
      profileHref: `/profile/business/${business.id}`,
      isAdmin,
    };
  }
  if (mentor) {
    return {
      id: viewerId,
      name: mentor.name,
      photoUrl: mentor.photoUrl,
      profileHref: `/profile/mentor/${mentor.id}`,
      isAdmin,
    };
  }
  if (investor) {
    return {
      id: viewerId,
      name: investor.name,
      photoUrl: investor.photoUrl,
      profileHref: `/profile/investor/${investor.id}`,
      isAdmin,
    };
  }
  return {
    id: viewerId,
    name:
      viewer.kind === "demo"
        ? viewer.persona.name
        : viewer.name ?? viewer.email?.split("@")[0] ?? "You",
    photoUrl: undefined,
    profileHref: null,
    isAdmin,
  };
}

/**
 * Identifies the viewer's profile kind, if any. Returns null when the viewer
 * has no completed profile of any kind.
 */
export async function getViewerKind(viewerId: string): Promise<ProfileKind | null> {
  const store = getDataStore();
  const [candidate, business, mentor, investor] = await Promise.all([
    store.getCandidate(viewerId),
    store.getBusiness(viewerId),
    store.getMentor(viewerId),
    store.getInvestor(viewerId),
  ]);
  if (candidate) return "candidate";
  if (business) return "business";
  if (mentor) return "mentor";
  if (investor) return "investor";
  return null;
}
