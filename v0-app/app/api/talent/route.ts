import { NextRequest } from "next/server";
import { profileStore, llmClient } from "@/lib/data-layer/factory";
import { ok, badRequest, serverError } from "@/lib/api/respond";
import { mergeTalent } from "@/lib/api/profile-helpers";
import type { TalentDTO } from "@/contracts/data";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<TalentDTO> & { bio: string; name: string; email: string };
    if (!body.bio) return badRequest("bio is required");
    const extracted = await llmClient.extractTalent(body.bio);
    const t = mergeTalent(body, extracted);
    await profileStore.putTalent(t);
    return ok(t, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}

export async function GET() {
  try {
    const list = await profileStore.listTalent();
    return ok(list);
  } catch (err) {
    return serverError(err);
  }
}
