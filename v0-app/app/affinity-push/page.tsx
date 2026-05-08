"use client";

import { useEffect, useState } from "react";
import type { AffinityPushPayload } from "@/contracts/data";
import { AffinityPayloadView } from "@/components/AffinityPayloadView";

export default function AffinityPushPage() {
  const [pushes, setPushes] = useState<AffinityPushPayload[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/affinity-pushes");
        if (!res.ok) {
          // mock-mode (NEXT_PUBLIC_SERVICE_MODE=mock with no API server) — read direct.
          const { getMockAffinityClient } = await import(
            "@/lib/data-layer/mock/MockAffinityClient"
          );
          const mock = getMockAffinityClient();
          if (!cancelled) setPushes(await mock.recentPushes());
          return;
        }
        const data = (await res.json()) as AffinityPushPayload[];
        if (!cancelled) setPushes(data);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="grid gap-6 py-2">
      <header>
        <h1 className="text-2xl font-semibold text-ink">Affinity push queue</h1>
        <p className="mt-1 text-sm text-warmgray-500">
          Every mutual match becomes an Affinity person + list-entry + note. In mock mode we
          render the would-be request payload; flip <code>AFFINITY_LIVE=true</code> to actually
          POST to <code>https://api.affinity.co</code>.
        </p>
      </header>

      {err && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{err}</div>}
      {pushes.length === 0 && (
        <div className="rounded border border-dashed border-warmgray-200 bg-white p-8 text-center text-sm text-warmgray-500">
          No mutual matches yet. Go to slide 6 and flip both sides to "interested".
        </div>
      )}

      <div className="grid gap-3">
        {pushes.map((p, i) => (
          <AffinityPayloadView key={i} p={p} />
        ))}
      </div>
    </div>
  );
}
