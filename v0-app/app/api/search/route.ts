import { NextRequest } from "next/server";
import { matchEngine } from "@/lib/data-layer/factory";
import { ok, badRequest, serverError } from "@/lib/api/respond";

/**
 * Free-text semantic search. Query → embedding → top-K → query rerank.
 *   GET /api/search?q=<text>&kind=talent|startup&k=20
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q") ?? "";
    const kind = url.searchParams.get("kind");
    const kRaw = url.searchParams.get("k");
    if (!q.trim()) return badRequest("`q` is required");
    if (kind !== "talent" && kind !== "startup") {
      return badRequest("`kind` must be talent or startup");
    }
    const k = kRaw ? Math.max(1, Math.min(50, Number(kRaw) || 20)) : 20;
    const out = await matchEngine.findFromQuery({ query: q, target: kind, k });
    return ok({ matches: out.matches, pipelineMs: out.pipelineMs });
  } catch (err) {
    return serverError(err);
  }
}
