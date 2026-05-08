import { NextRequest } from "next/server";
import { notificationStore } from "@/lib/data-layer/factory";
import { ok, badRequest, serverError } from "@/lib/api/respond";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      recipientId: string;
      ids?: string[];
      all?: boolean;
    };
    if (!body.recipientId) return badRequest("`recipientId` required");
    await notificationStore.markRead(body);
    return ok({});
  } catch (err) {
    return serverError(err);
  }
}
