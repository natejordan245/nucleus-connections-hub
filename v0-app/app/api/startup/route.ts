import { NextRequest } from "next/server";
import { profileStore, llmClient } from "@/lib/data-layer/factory";
import { ok, badRequest, serverError } from "@/lib/api/respond";
import { mergeStartup } from "@/lib/api/profile-helpers";
import type { StartupDTO } from "@/contracts/data";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<StartupDTO> & { description: string; name: string };
    if (!body.description) return badRequest("description is required");
    const extracted = await llmClient.extractStartup(body.description);
    const s = mergeStartup(body, extracted);
    await profileStore.putStartup(s);
    return ok(s, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}

export async function GET() {
  try {
    const list = await profileStore.listStartups();
    return ok(list);
  } catch (err) {
    return serverError(err);
  }
}
