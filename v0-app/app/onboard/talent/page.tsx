"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DemoTextInput } from "@/lib/demo/DemoTextInput";
import { PhotoUpload } from "@/components/PhotoUpload";
import { profileService } from "@/lib/services/factory";
import type { TalentDTO } from "@/contracts/data";

export default function OnboardTalentPage() {
  const router = useRouter();
  const [name, setName] = useState("Sarah Chen");
  const [email, setEmail] = useState("sarah.chen@example.com");
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [xUrl, setXUrl] = useState("");
  const [bio, setBio] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [extracted, setExtracted] = useState<Partial<TalentDTO> | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Extraction runs off the combined bio + lookingFor since both carry signal.
  useEffect(() => {
    const combined = `${bio}\n\n${lookingFor}`.trim();
    if (combined.length < 80) {
      setExtracted(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setExtracting(true);
      try {
        const out = await profileService.extractFromBio({ kind: "talent", bio: combined });
        if (!cancelled) setExtracted(out);
      } finally {
        if (!cancelled) setExtracting(false);
      }
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [bio, lookingFor]);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const t = await profileService.createTalent({
        name,
        email,
        bio,
        lookingFor: lookingFor || undefined,
        photoUrl,
        linkedinUrl: linkedinUrl || undefined,
        xUrl: xUrl || undefined,
      });
      router.push(`/profile/talent/${t.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 py-4 lg:grid-cols-[1.4fr_1fr]">
      <section className="rounded-xl border border-warmgray-100 bg-white p-7 shadow-sm">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink">
          Onboard a talent profile
        </h1>
        <p className="mt-1 text-sm text-warmgray-600">
          Free-text bio in, structured profile out. Double-click any field to demo.
        </p>

        <div className="mt-6">
          <PhotoUpload id="new-talent" name={name} photoUrl={photoUrl} onChange={setPhotoUrl} />
        </div>

        <div className="mt-6 grid gap-4">
          <DemoTextInput
            demoKey="talent-name-sarah-chen"
            label="Name"
            value={name}
            onChange={setName}
          />
          <DemoTextInput
            demoKey="talent-email-sarah-chen"
            label="Email"
            value={email}
            onChange={setEmail}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <LabeledInput
              label="LinkedIn URL"
              placeholder="https://www.linkedin.com/in/…"
              value={linkedinUrl}
              onChange={setLinkedinUrl}
            />
            <LabeledInput
              label="X / Twitter URL"
              placeholder="https://x.com/…"
              value={xUrl}
              onChange={setXUrl}
            />
          </div>
          <DemoTextInput
            demoKey="talent-bio-sarah-chen"
            label="Bio — who you are"
            multiline
            rows={6}
            value={bio}
            onChange={setBio}
            placeholder="Background, experience, the work you've shipped…"
          />
          <DemoTextInput
            demoKey="talent-looking-for-sarah-chen"
            label="What you're mainly looking for"
            multiline
            rows={5}
            value={lookingFor}
            onChange={setLookingFor}
            placeholder="Role, stage, sector, comp shape, hours, mission constraints. The more specific, the better the matches."
          />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            disabled={submitting || !bio || !lookingFor || !name}
            onClick={handleSubmit}
            className="rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(255,114,39,0.55)] transition hover:bg-orange-600 disabled:opacity-50"
          >
            {submitting ? "Building profile…" : "Build my profile →"}
          </button>
          {extracting && (
            <span className="text-xs text-warmgray-500">Extracting structured fields…</span>
          )}
        </div>
      </section>

      <aside className="rounded-xl border border-warmgray-100 bg-white p-7 shadow-sm">
        <h2 className="eyebrow text-warmgray-500">Auto-extracted fields</h2>
        {!extracted && (
          <p className="mt-3 text-sm text-warmgray-600">
            Once the bio is rich enough, the LLM extracts skills, availability, compensation, and
            stage preferences. Double-click the bio above to demo.
          </p>
        )}

        {extracted && (
          <dl className="mt-3 grid gap-3 text-sm">
            <Row label="Headline" value={extracted.headline} />
            <Row label="Skills" value={extracted.skills?.join(", ")} />
            <Row label="Domains" value={extracted.domains?.join(", ")} />
            <Row label="Availability" value={extracted.availability} />
            <Row label="Compensation" value={extracted.compensation?.join(", ")} />
            <Row label="Stage prefs" value={extracted.stagePrefs?.join(", ")} />
            <Row label="Risk tolerance" value={String(extracted.riskTolerance ?? "")} />
            <Row label="Location" value={extracted.location} />
          </dl>
        )}
      </aside>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-warmgray-500">{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.currentTarget.value)}
        className="block w-full rounded border border-warmgray-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-orange-500 focus:ring-2 focus:ring-sand-100"
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="border-b border-warmgray-100 pb-2 last:border-0">
      <dt className="eyebrow text-warmgray-500">{label}</dt>
      <dd className="mt-1 text-ink">{value || <span className="text-warmgray-300">—</span>}</dd>
    </div>
  );
}
