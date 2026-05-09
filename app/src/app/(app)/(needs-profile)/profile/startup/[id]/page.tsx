import { permanentRedirect } from "next/navigation";

/**
 * Legacy redirect: `/profile/startup/<id>` → `/profile/business/<id>`.
 * Kept so that already-emitted notification and affinity-push links don't 404
 * after the four-kind pivot.
 */
export default function LegacyStartupProfileRedirect({
  params,
}: {
  params: { id: string };
}) {
  permanentRedirect(`/profile/business/${params.id}`);
}
