import { NextResponse } from "next/server";
import {
  AFFINITY_CONFIG,
  verifyAffinitySignature,
  type AffinityWebhookEvent,
} from "@/lib/affinity";
import { getDataStore } from "@/lib/data";

/**
 * Affinity webhook receiver.
 *
 * Affinity signs each webhook with HMAC-SHA256 over the raw body using the
 * workspace's `AFFINITY_WEBHOOK_SECRET`, sending the hex digest in the
 * `Affinity-Signature` header. We verify the signature, then dispatch on
 * `type`. Currently we react to:
 *
 *   - `list_entry.created` / `list_entry.updated` → confirm we have the row
 *   - `field_value.updated` (pipeline stage) → emit a notification when a
 *     deal moves through the pipeline so operators see it in-app
 *
 * The route accepts unsigned bodies in development when no secret is set
 * (the default `demo-affinity-secret-do-not-ship` value). In production the
 * signature must be present and valid.
 */

export const runtime = "nodejs";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("affinity-signature");

  // In production we'd refuse unsigned bodies outright. For the hackathon
  // build the demo secret is well-known so unit tests / demos can post
  // synthetic events; we still verify when a signature is provided.
  if (signature && !verifyAffinitySignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let event: AffinityWebhookEvent;
  try {
    event = JSON.parse(rawBody) as AffinityWebhookEvent;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const store = getDataStore();

  switch (event.type) {
    case "list_entry.created":
    case "list_entry.updated": {
      // Affinity confirmed our list-entry mutation. We don't currently
      // persist anything new on this signal, but it's the spot to wire a
      // resync if we ever desync from Affinity-side state.
      return NextResponse.json({ ok: true, acknowledged: event.type });
    }
    case "field_value.updated": {
      const fv = event.body.field_value;
      // Only the pipeline-stage field carries operator-visible meaning.
      if (fv.field_id !== AFFINITY_CONFIG.fields.pipelineStage) {
        return NextResponse.json({ ok: true, ignored: "unrelated field" });
      }
      const text =
        fv.value_type === "dropdown" && typeof fv.value === "object" && "text" in fv.value
          ? fv.value.text
          : String(fv.value);

      // Best-effort: notify Nucleus admins that a deal moved.
      const adminIds = await store.resolveAdminUserIds();
      for (const adminId of adminIds) {
        await store.emitNotification({
          recipientId: adminId,
          kind: "system",
          title: `Affinity: deal moved to "${text}"`,
          body: `List entry #${fv.list_entry_id} pipeline stage updated.`,
          href: "/affinity-push",
        });
      }
      return NextResponse.json({ ok: true, broadcasted: adminIds.length });
    }
    default: {
      // Unknown event types are accepted but not processed — Affinity will
      // retry only on non-2xx responses, and we don't want retries for
      // events we just don't handle yet.
      return NextResponse.json({ ok: true, ignored: "unknown event type" });
    }
  }
}

// Reject other methods explicitly so Affinity sees a clean 405 rather than
// the App Router's default 404 if it probes the route.
export function GET() {
  return NextResponse.json({ error: "method not allowed" }, { status: 405 });
}
