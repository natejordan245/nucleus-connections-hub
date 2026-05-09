import { permanentRedirect } from "next/navigation";

/**
 * Legacy redirect: `/profile/talent/<id>` → `/profile/candidate/<id>`.
 * Kept so that already-emitted notification and affinity-push links don't 404
 * after the four-kind pivot.
 */
export default function LegacyTalentProfileRedirect({
  params,
}: {
  params: { id: string };
}) {
  permanentRedirect(`/profile/candidate/${params.id}`);
}
