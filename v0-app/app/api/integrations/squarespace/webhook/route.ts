import { NextRequest } from "next/server";
import { profileStore, llmClient } from "@/lib/data-layer/factory";
import { ok, badRequest, fail, serverError } from "@/lib/api/respond";
import { mergeTalent, mergeStartup } from "@/lib/api/profile-helpers";

/**
 * Inbound webhook from Squarespace forms (replaces the existing Typeform leg).
 * Validates a shared-secret header, normalizes payload, runs LLM extraction,
 * persists. Returns a one-time review URL the form-submitter can click.
 */
export async function POST(req: NextRequest) {
  try {
    const expected = process.env.SQUARESPACE_WEBHOOK_SECRET ?? "";
    const got = req.headers.get("x-nucleus-secret") ?? "";
    if (expected && got !== expected) return fail(401, "unauthorized", "bad webhook secret");

    const body = (await req.json()) as {
      kind: "talent" | "startup";
      name?: string;
      email?: string;
      bio?: string;
      description?: string;
    };

    if (body.kind === "talent") {
      if (!body.name || !body.email || !body.bio) {
        return badRequest("talent webhook needs name, email, bio");
      }
      const extracted = await llmClient.extractTalent(body.bio);
      const t = mergeTalent({ name: body.name, email: body.email, bio: body.bio }, extracted);
      await profileStore.putTalent(t);
      return ok({ id: t.id, reviewUrl: `/onboard/talent?token=${t.id}` }, { status: 201 });
    }

    if (body.kind === "startup") {
      if (!body.name || !body.description) {
        return badRequest("startup webhook needs name, description");
      }
      const extracted = await llmClient.extractStartup(body.description);
      const s = mergeStartup({ name: body.name, description: body.description }, extracted);
      await profileStore.putStartup(s);
      return ok({ id: s.id, reviewUrl: `/onboard/startup?token=${s.id}` }, { status: 201 });
    }

    return badRequest("kind must be talent or startup");
  } catch (err) {
    return serverError(err);
  }
}
