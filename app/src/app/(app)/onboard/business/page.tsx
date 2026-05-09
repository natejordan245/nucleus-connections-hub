import { BusinessOnboardForm } from "@/components/BusinessOnboardForm";
import { createBusiness } from "../actions";

export default async function OnboardBusinessPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  return (
    <BusinessOnboardForm
      error={searchParams?.error}
      createBusinessAction={createBusiness}
    />
  );
}
