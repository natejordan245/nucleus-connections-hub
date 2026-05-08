import { affinityClient } from "@/lib/data-layer/factory";
import { ok, serverError } from "@/lib/api/respond";

/** Read-only feed of recent (real or would-be) Affinity pushes for the admin slide. */
export async function GET() {
  try {
    return ok(await affinityClient.recentPushes());
  } catch (err) {
    return serverError(err);
  }
}
