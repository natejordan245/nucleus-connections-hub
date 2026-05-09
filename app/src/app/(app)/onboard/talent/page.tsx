import { permanentRedirect } from "next/navigation";

/** Legacy redirect: `/onboard/talent` → `/onboard/candidate`. */
export default function LegacyOnboardTalentRedirect() {
  permanentRedirect("/onboard/candidate");
}
