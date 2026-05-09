import { TalentOnboardForm } from "@/components/TalentOnboardForm";
import { getViewer } from "@/lib/session";
import { createCandidate } from "../actions";

export default async function OnboardCandidatePage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const viewer = await getViewer();
  const prefilledName =
    viewer.kind === "demo"
      ? viewer.persona.name
      : viewer.kind === "live"
        ? viewer.name ?? viewer.email?.split("@")[0]
        : undefined;
  const prefilledEmail =
    viewer.kind === "demo"
      ? viewer.persona.email
      : viewer.kind === "live"
        ? viewer.email ?? undefined
        : undefined;
  return (
    <TalentOnboardForm
      error={searchParams?.error}
      createTalentAction={createCandidate}
      prefilledName={prefilledName ?? undefined}
      prefilledEmail={prefilledEmail ?? undefined}
    />
  );
}
