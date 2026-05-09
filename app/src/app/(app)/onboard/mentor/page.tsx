import { MentorOnboardForm } from "@/components/MentorOnboardForm";
import { getViewer } from "@/lib/session";
import { createMentor } from "../actions";

export default async function OnboardMentorPage({
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
    <MentorOnboardForm
      error={searchParams?.error}
      createMentorAction={createMentor}
      prefilledName={prefilledName ?? undefined}
      prefilledEmail={prefilledEmail ?? undefined}
    />
  );
}
