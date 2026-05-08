import { NextRequest } from "next/server";
import { profileStore } from "@/lib/data-layer/factory";
import { ok, notFound, serverError } from "@/lib/api/respond";
import type { TalentDTO } from "@/contracts/data";

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const t = await profileStore.getTalent(ctx.params.id);
    return t ? ok(t) : notFound("talent not found");
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const cur = await profileStore.getTalent(ctx.params.id);
    if (!cur) return notFound("talent not found");
    const patch = (await req.json()) as Partial<TalentDTO>;
    const next: TalentDTO = { ...cur, ...patch, id: cur.id, createdAt: cur.createdAt };
    await profileStore.putTalent(next);
    return ok(next);
  } catch (err) {
    return serverError(err);
  }
}
