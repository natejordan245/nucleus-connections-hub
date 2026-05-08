import { NextRequest } from "next/server";
import { notificationStore } from "@/lib/data-layer/factory";
import { ok, badRequest, serverError } from "@/lib/api/respond";

export async function GET(req: NextRequest) {
  try {
    const recipientId = new URL(req.url).searchParams.get("recipientId");
    if (!recipientId) return badRequest("`recipientId` required");
    return ok(await notificationStore.list(recipientId));
  } catch (err) {
    return serverError(err);
  }
}
