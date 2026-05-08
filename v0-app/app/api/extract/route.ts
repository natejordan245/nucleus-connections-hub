import { NextRequest } from "next/server";
import { llmClient } from "@/lib/data-layer/factory";
import { ok, badRequest, serverError } from "@/lib/api/respond";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as
      | { kind: "talent"; bio: string }
      | { kind: "startup"; description: string };
    if (body.kind === "talent") {
      if (!body.bio) return badRequest("bio is required");
      return ok(await llmClient.extractTalent(body.bio));
    }
    if (body.kind === "startup") {
      if (!body.description) return badRequest("description is required");
      return ok(await llmClient.extractStartup(body.description));
    }
    return badRequest("unknown kind");
  } catch (err) {
    return serverError(err);
  }
}
