"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Briefcase, Building2, Coins, Compass, Lock, type LucideIcon } from "lucide-react";
import {
  submitEmbedSignup,
  type EmbedRole,
  type EmbedSignupInput,
} from "../actions";

type Step = 1 | 2 | 3;

type RoleDef = {
  id: EmbedRole;
  title: string;
  body: string;
  Icon: LucideIcon;
};

const ROLES: RoleDef[] = [
  {
    id: "candidate",
    title: "Candidate",
    body: "Operator, executive, engineer, or student looking for a role.",
    Icon: Briefcase,
  },
  {
    id: "business",
    title: "Business",
    body: "Founder building a company, hiring, or fundraising.",
    Icon: Building2,
  },
  {
    id: "mentor",
    title: "Mentor",
    body: "Advisor offering time, expertise, or board seats.",
    Icon: Compass,
  },
  {
    id: "investor",
    title: "VC",
    body: "Investor backing Utah businesses.",
    Icon: Coins,
  },
];

export function EmbedSignupFlow({ originBaseUrl }: { originBaseUrl: string }) {
  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState<EmbedRole | null>(null);
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isBusiness = role === "business";

  function next() {
    setError(null);
    if (step === 1) {
      if (!role) {
        setError("Pick what you are to continue.");
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!fullName.trim()) return setError("Your name is required.");
      if (isBusiness && !companyName.trim()) return setError("Company name is required.");
      if (!bio.trim()) return setError("Add a short description.");
      setStep(3);
      return;
    }
  }

  function back() {
    setError(null);
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;
    setError(null);
    const input: EmbedSignupInput = {
      role,
      fullName: fullName.trim(),
      companyName: isBusiness ? companyName.trim() : undefined,
      headline: headline.trim(),
      bio: bio.trim(),
      email: email.trim(),
      password,
    };
    startTransition(async () => {
      const result = await submitEmbedSignup(input);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const fullUrl = originBaseUrl + result.redirectUrl;
      // Tell the parent loader to navigate the top-level window. Falls back
      // to a same-frame navigation if we're not actually iframed.
      try {
        window.parent.postMessage(
          { source: "nucleus-embed", type: "complete", url: fullUrl },
          "*",
        );
      } catch {
        // ignore — we'll fall through to top.location below.
      }
      try {
        if (window.top && window.top !== window.self) {
          window.top.location.href = fullUrl;
        } else {
          window.location.href = fullUrl;
        }
      } catch {
        window.location.href = fullUrl;
      }
    });
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-6 py-8">
      <Header step={step} />

      <form onSubmit={handleSubmit} className="mt-6 flex flex-1 flex-col">
        {step === 1 && (
          <RoleStep
            value={role}
            onChange={(r) => {
              setRole(r);
              setError(null);
            }}
          />
        )}

        {step === 2 && role && (
          <ProfileStep
            role={role}
            fullName={fullName}
            companyName={companyName}
            headline={headline}
            bio={bio}
            onChange={(patch) => {
              if (patch.fullName !== undefined) setFullName(patch.fullName);
              if (patch.companyName !== undefined) setCompanyName(patch.companyName);
              if (patch.headline !== undefined) setHeadline(patch.headline);
              if (patch.bio !== undefined) setBio(patch.bio);
            }}
          />
        )}

        {step === 3 && (
          <AccountStep
            email={email}
            password={password}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
          />
        )}

        {error && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <Footer
          step={step}
          isPending={isPending}
          onBack={back}
          onNext={next}
        />
      </form>
    </div>
  );
}

function Header({ step }: { step: Step }) {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Image
          src="/icon.webp"
          alt=""
          width={24}
          height={24}
          className="h-6 w-6"
          aria-hidden
        />
        <span className="font-serif text-sm font-semibold text-ink">
          Connections Hub
        </span>
      </div>
      <Stepper step={step} />
    </header>
  );
}

function Stepper({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3].map((n) => {
        const active = n === step;
        const done = n < step;
        return (
          <span
            key={n}
            className={
              "h-1.5 w-6 rounded-full transition " +
              (active
                ? "bg-orange-500"
                : done
                  ? "bg-orange-300"
                  : "bg-warmgray-200")
            }
            aria-hidden
          />
        );
      })}
      <span className="ml-2 font-mono text-[11px] text-warmgray-500">
        {step} / 3
      </span>
    </div>
  );
}

function RoleStep({
  value,
  onChange,
}: {
  value: EmbedRole | null;
  onChange: (r: EmbedRole) => void;
}) {
  return (
    <section>
      <span className="eyebrow text-orange-500">Step 1</span>
      <h1 className="mt-2 font-serif text-2xl font-semibold leading-tight text-ink">
        Tell us who you are.
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-warmgray-600">
        Pick the lane that fits. We'll tailor the rest from there.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ROLES.map(({ id, title, body, Icon }) => {
          const active = value === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={
                "group flex flex-col rounded-2xl border p-5 text-left transition " +
                (active
                  ? "border-orange-500 bg-orange-50/50 shadow-[0_8px_24px_-12px_rgba(37,99,235,0.45)]"
                  : "border-warmgray-100 bg-white hover:border-orange-300")
              }
              aria-pressed={active}
            >
              <span
                className={
                  "inline-flex h-10 w-10 items-center justify-center rounded-full " +
                  (active ? "bg-orange-500 text-white" : "bg-orange-50 text-orange-700")
                }
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </span>
              <h2 className="mt-3 font-serif text-base font-semibold text-ink">
                {title}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-warmgray-600">{body}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ProfileStep({
  role,
  fullName,
  companyName,
  headline,
  bio,
  onChange,
}: {
  role: EmbedRole;
  fullName: string;
  companyName: string;
  headline: string;
  bio: string;
  onChange: (patch: {
    fullName?: string;
    companyName?: string;
    headline?: string;
    bio?: string;
  }) => void;
}) {
  const isBusiness = role === "business";
  const headlineLabel = isBusiness ? "One-liner" : "Headline";
  const headlinePlaceholder = isBusiness
    ? "What does the company do, in one line?"
    : "How would you describe yourself in one line?";
  const bioLabel = isBusiness ? "What you're building" : "About you";
  const bioPlaceholder = isBusiness
    ? "A few sentences on the company, traction, and what you need."
    : "A few sentences on your background and what you're looking for.";

  return (
    <section>
      <span className="eyebrow text-orange-500">Step 2</span>
      <h1 className="mt-2 font-serif text-2xl font-semibold leading-tight text-ink">
        {isBusiness ? "Your company" : "Your profile"}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-warmgray-600">
        You can polish all of this later from your profile.
      </p>

      <div className="mt-6 space-y-4">
        <Field label="Your name">
          <Input
            value={fullName}
            onChange={(v) => onChange({ fullName: v })}
            placeholder="Jane Operator"
            autoComplete="name"
          />
        </Field>

        {isBusiness && (
          <Field label="Company name">
            <Input
              value={companyName}
              onChange={(v) => onChange({ companyName: v })}
              placeholder="Bramble AI"
              autoComplete="organization"
            />
          </Field>
        )}

        <Field label={headlineLabel}>
          <Input
            value={headline}
            onChange={(v) => onChange({ headline: v })}
            placeholder={headlinePlaceholder}
          />
        </Field>

        <Field label={bioLabel}>
          <textarea
            value={bio}
            onChange={(e) => onChange({ bio: e.target.value })}
            placeholder={bioPlaceholder}
            rows={4}
            className="mt-1 w-full rounded-lg border border-warmgray-200 bg-white px-3 py-2 text-sm leading-relaxed text-ink outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-300/40"
          />
        </Field>
      </div>
    </section>
  );
}

function AccountStep({
  email,
  password,
  onEmailChange,
  onPasswordChange,
}: {
  email: string;
  password: string;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
}) {
  return (
    <section>
      <span className="eyebrow text-orange-500">Step 3</span>
      <h1 className="mt-2 font-serif text-2xl font-semibold leading-tight text-ink">
        Create your account
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-warmgray-600">
        Last step. Your profile saves the moment you finish here.
      </p>

      <div className="mt-6 space-y-4">
        <Field label="Email">
          <Input
            value={email}
            onChange={onEmailChange}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Password">
          <Input
            value={password}
            onChange={onPasswordChange}
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />
        </Field>
      </div>

      <p className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-warmgray-500">
        <Lock className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
        We'll sign you in and take you straight to your profile.
      </p>
    </section>
  );
}

function Footer({
  step,
  isPending,
  onBack,
  onNext,
}: {
  step: Step;
  isPending: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  const isFinal = step === 3;
  return (
    <div className="mt-auto flex items-center justify-between pt-8">
      <button
        type="button"
        onClick={onBack}
        disabled={step === 1 || isPending}
        className="text-sm font-semibold text-warmgray-700 transition hover:text-ink disabled:invisible"
      >
        ← Back
      </button>

      {isFinal ? (
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-10 items-center justify-center rounded-full bg-orange-500 px-6 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.55)] transition hover:bg-orange-600 disabled:opacity-60"
        >
          {isPending ? "Creating…" : "Create account →"}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          className="inline-flex h-10 items-center justify-center rounded-full bg-orange-500 px-6 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.55)] transition hover:bg-orange-600"
        >
          Continue →
        </button>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
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
  type = "text",
  placeholder,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      type={type}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className="mt-1 w-full rounded-lg border border-warmgray-200 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-300/40"
    />
  );
}
