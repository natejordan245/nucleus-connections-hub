import { BusinessOnboardForm } from "@/components/BusinessOnboardForm";
import { getViewer } from "@/lib/session";
import { createBusiness } from "../actions";

export default async function OnboardBusinessPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const viewer = await getViewer();
  const signedIn = viewer.kind !== "anon";
  return (
    <BusinessOnboardForm
      error={searchParams?.error}
      createBusinessAction={createBusiness}
      signedIn={signedIn}
    />
  );
}
