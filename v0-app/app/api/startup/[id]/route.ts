import { NextRequest } from "next/server";
import { profileStore } from "@/lib/data-layer/factory";
import { ok, notFound, serverError } from "@/lib/api/respond";
import type { StartupDTO } from "@/contracts/data";

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const s = await profileStore.getStartup(ctx.params.id);
    return s ? ok(s) : notFound("startup not found");
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const cur = await profileStore.getStartup(ctx.params.id);
    if (!cur) return notFound("startup not found");
    const patch = (await req.json()) as Partial<StartupDTO>;
    const next: StartupDTO = { ...cur, ...patch, id: cur.id, createdAt: cur.createdAt };
    await profileStore.putStartup(next);
    return ok(next);
  } catch (err) {
    return serverError(err);
  }
}
