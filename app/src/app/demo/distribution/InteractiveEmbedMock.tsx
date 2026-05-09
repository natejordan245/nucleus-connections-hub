"use client";

import { useState } from "react";
import {
  Briefcase,
  Building2,
  Coins,
  Compass,
  Lock,
  type LucideIcon,
} from "lucide-react";

type Role = "candidate" | "business" | "mentor" | "investor";

type RoleDef = {
  id: Role;
  title: string;
  body: string;
  Icon: LucideIcon;
};

const ROLES: RoleDef[] = [
  {
    id: "candidate",
    title: "Candidate",
    body: "Operator, exec, engineer, student.",
    Icon: Briefcase,
  },
  {
    id: "business",
    title: "Business",
    body: "Founder hiring or fundraising.",
    Icon: Building2,
  },
  {
    id: "mentor",
    title: "Mentor",
    body: "Advisor offering time + expertise.",
    Icon: Compass,
  },
  {
    id: "investor",
    title: "VC",
    body: "Investor backing Utah businesses.",
    Icon: Coins,
  },
];

/**
 * The embed widget rendered on the slide — interactive enough to walk
 * through Step 1 → Step 2 without actually submitting anything. Step 2's
 * fields are role-tailored to mirror the real `<EmbedSignupFlow>`. The
 * final continue is intentionally inert so the slide doesn't get sucked
 * into the full live flow.
 */
export function InteractiveEmbedMock() {
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role | null>(null);
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [headline, setHeadline] = useState("");

  const isBusiness = role === "business";
  const headlinePlaceholder = isBusiness
    ? "What does the company do, in one line?"
    : "How would you describe yourself in one line?";

  function reset() {
    setStep(1);
    setRole(null);
    setFullName("");
    setCompanyName("");
    setHeadline("");
  }

  return (
    <div className="rounded-xl border border-warmgray-200 bg-white p-5 shadow-[0_4px_16px_-8px_rgba(15,23,42,0.18)]">
      <div className="flex items-center justify-between">
        <span className="eyebrow text-orange-500">Step {step} of 3</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-warmgray-400">
          embed
        </span>
      </div>

      {step === 1 && (
        <>
          <h3 className="mt-2 text-base font-semibold text-ink">
            What are you?
          </h3>
          <ul className="mt-3 space-y-2">
            {ROLES.map(({ id, title, body, Icon }) => {
              const active = role === id;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => setRole(id)}
                    className={
                      "flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left transition " +
                      (active
                        ? "border-orange-500 bg-orange-50/70"
                        : "border-warmgray-200 bg-white hover:border-orange-300")
                    }
                    aria-pressed={active}
                  >
                    <span
                      className={
                        "mt-0.5 inline-flex h-7 w-7 flex-none items-center justify-center rounded-md " +
                        (active
                          ? "bg-orange-500 text-white"
                          : "bg-orange-50 text-orange-700")
                      }
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="text-sm font-semibold text-ink">
                          {title}
                        </span>
                        {active && (
                          <span className="font-mono text-[10px] uppercase tracking-wider text-orange-600">
                            selected
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-[12px] leading-snug text-warmgray-600">
                        {body}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={() => role && setStep(2)}
            disabled={!role}
            className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-full bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-40"
          >
            Continue →
          </button>
        </>
      )}

      {step === 2 && role && (
        <>
          <h3 className="mt-2 text-base font-semibold text-ink">
            {isBusiness ? "Your company" : "Your profile"}
          </h3>
          <p className="mt-1 text-[12px] leading-snug text-warmgray-600">
            You can polish all of this later from your profile.
          </p>

          <div className="mt-3 space-y-3">
            <Field label="Your name">
              <Input
                value={fullName}
                onChange={setFullName}
                placeholder="Jane Operator"
              />
            </Field>

            {isBusiness && (
              <Field label="Company name">
                <Input
                  value={companyName}
                  onChange={setCompanyName}
                  placeholder="Bramble AI"
                />
              </Field>
            )}

            <Field label={isBusiness ? "One-liner" : "Headline"}>
              <Input
                value={headline}
                onChange={setHeadline}
                placeholder={headlinePlaceholder}
              />
            </Field>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 rounded-md border border-warmgray-200 bg-warmgray-50 px-3 py-2 text-[11px] text-warmgray-600">
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3 w-3" strokeWidth={2} aria-hidden />
              Slide preview · final step + sign-up runs at /embed/signup
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={reset}
              className="text-xs font-semibold text-warmgray-600 transition hover:text-ink"
            >
              ← Back
            </button>
            <button
              type="button"
              disabled
              className="inline-flex h-9 items-center justify-center rounded-full bg-orange-500/40 px-5 text-sm font-semibold text-white"
            >
              Continue →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="eyebrow text-warmgray-500">{label}</span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mt-1 w-full rounded-lg border border-warmgray-200 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-300/40"
    />
  );
}
