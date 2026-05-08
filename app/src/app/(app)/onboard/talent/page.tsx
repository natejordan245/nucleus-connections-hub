import { TalentOnboardForm } from "@/components/TalentOnboardForm";
import { createTalent } from "../actions";

export default async function OnboardTalentPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  return (
    <TalentOnboardForm
      error={searchParams?.error}
      createTalentAction={createTalent}
    />
  );
}
