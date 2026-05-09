import { BusinessOnboardForm } from "@/components/BusinessOnboardForm";
import { getDataStore } from "@/lib/data";
import { getViewer } from "@/lib/session";
import { createBusiness } from "../actions";

export default async function OnboardBusinessPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const viewer = await getViewer();
  const signedIn = viewer.kind !== "anon";
  const viewerId =
    viewer.kind === "live" ? viewer.userId : viewer.kind === "demo" ? viewer.persona.id : null;
  const initial = viewerId ? (await getDataStore().getBusiness(viewerId)) ?? undefined : undefined;
  return (
    <BusinessOnboardForm
      error={searchParams?.error}
      createBusinessAction={createBusiness}
      signedIn={signedIn}
      initial={initial}
    />
  );
}
