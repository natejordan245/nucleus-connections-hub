"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DemoTextInput } from "@/lib/demo/DemoTextInput";
import { profileService } from "@/lib/services/factory";
import type { StartupDTO } from "@/contracts/data";

export default function OnboardStartupPage() {
  const router = useRouter();
  const [name, setName] = useState("Lumen Bio");
  const [description, setDescription] = useState("");
  const [extracted, setExtracted] = useState<Partial<StartupDTO> | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (description.length < 80) {
      setExtracted(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setExtracting(true);
      try {
        const out = await profileService.extractFromBio({ kind: "startup", description });
        if (!cancelled) setExtracted(out);
      } finally {
        if (!cancelled) setExtracting(false);
      }
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [description]);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const s = await profileService.createStartup({ name, description });
      router.push(`/profile/startup/${s.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 py-4">
      <SkipBanner />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <section className="rounded-xl border border-warmgray-100 bg-white p-7 shadow-sm">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink">
          Onboard a startup profile
        </h1>
        <p className="mt-1 text-sm text-warmgray-600">
          Description in, structured spinout profile out. Skip this step if you're not adding a
          company.
        </p>

        <div className="mt-5 grid gap-4">
          <DemoTextInput
            demoKey="startup-name-lumen-bio"
            label="Company name"
            value={name}
            onChange={setName}
          />
          <DemoTextInput
            demoKey="startup-description-lumen-bio"
            label="Description"
            multiline
            rows={10}
            value={description}
            onChange={setDescription}
            placeholder="Sector, origin (university spinout? VC-backed?), funding stage, immediate hiring needs, comp shape…"
          />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            disabled={submitting || !description || !name}
            onClick={handleSubmit}
            className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-orange-600 disabled:opacity-50"
          >
            {submitting ? "Building profile…" : "Build company profile →"}
          </button>
          {extracting && (
            <span className="text-xs text-warmgray-500">Extracting structured fields…</span>
          )}
        </div>
      </section>

      <aside className="rounded-lg border border-warmgray-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-warmgray-500">
          Auto-extracted fields
        </h2>
        {!extracted && (
          <p className="mt-3 text-sm text-warmgray-500">
            Double-click the description to type out the demo content.
          </p>
        )}
        {extracted && (
          <dl className="mt-3 grid gap-3 text-sm">
            <Row label="One-liner" value={extracted.oneLiner} />
            <Row label="Sector" value={extracted.sector} />
            <Row label="Origin" value={extracted.origin} />
            <Row label="Funding stage" value={extracted.fundingStage} />
            <Row label="Funding status" value={extracted.fundingStatus} />
            <Row label="Needs" value={extracted.needs?.join(", ")} />
          </dl>
        )}
      </aside>
      </div>
    </div>
  );
}

function SkipBanner() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-orange-200 bg-sand-50 px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="eyebrow text-orange-700">Optional step</div>
        <p className="mt-1 text-sm text-ink">
          Onboarding a company is optional. If you're just looking for opportunities, skip ahead.
        </p>
      </div>
      <Link
        href="/matches?as=tal-sarah-chen"
        className="shrink-0 rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-[0_4px_12px_-4px_rgba(255,114,39,0.55)] transition hover:bg-orange-600"
      >
        Skip — go to opportunities →
      </Link>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="border-b border-warmgray-100 pb-2 last:border-0">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-warmgray-500">{label}</dt>
      <dd className="text-ink">{value || <span className="text-warmgray-300">—</span>}</dd>
    </div>
  );
}
