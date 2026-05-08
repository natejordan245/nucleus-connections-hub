import { NextRequest } from "next/server";
import { matchEngine } from "@/lib/data-layer/factory";
import { ok, badRequest, serverError } from "@/lib/api/respond";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const forId = url.searchParams.get("for");
    const type = url.searchParams.get("type");
    const targetParam = url.searchParams.get("target");
    if (!forId) return badRequest("`for` query param required");
    if (type !== "talent" && type !== "startup") {
      return badRequest("`type` must be talent or startup");
    }
    let target: "talent" | "startup" | undefined;
    if (targetParam !== null) {
      if (targetParam !== "talent" && targetParam !== "startup") {
        return badRequest("`target` must be talent or startup");
      }
      target = targetParam;
    }
    const out = await matchEngine.findMatches({ for: forId, type, target });
    return ok({ matches: out.matches, pipelineMs: out.pipelineMs });
  } catch (err) {
    return serverError(err);
  }
}
