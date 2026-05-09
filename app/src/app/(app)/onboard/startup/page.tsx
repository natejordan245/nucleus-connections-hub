import { permanentRedirect } from "next/navigation";

/** Legacy redirect: `/onboard/startup` → `/onboard/business`. */
export default function LegacyOnboardStartupRedirect() {
  permanentRedirect("/onboard/business");
}
