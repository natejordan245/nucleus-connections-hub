"use client";

import { Lock } from "lucide-react";
import { Field, Input } from "@/components/FormField";

/**
 * "Create account" block rendered at the bottom of every onboard form when the
 * viewer isn't signed in yet. The server actions read these values, call
 * `supabase.auth.signUp`, and then write the profile row under the new auth
 * user id — so account creation happens *after* the user fills the rest of
 * the form.
 *
 * Hidden when the viewer is already signed in.
 */
export function OnboardAccountFields({
  signedIn,
  errorMessage,
}: {
  signedIn: boolean;
  errorMessage?: string | null;
}) {
  if (signedIn) return null;
  return (
    <section className="rounded-2xl border border-warmgray-100 bg-orange-50/30 p-5">
      <div className="flex items-center gap-2">
        <Lock className="h-4 w-4 text-orange-500" strokeWidth={1.75} aria-hidden />
        <span className="eyebrow text-orange-500">Create your account</span>
      </div>
      <p className="mt-2 text-sm text-warmgray-700">
        Last step. Your profile is saved when you finish here.
      </p>
      {errorMessage && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      )}
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field id="email" name="email" label="Email" required>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </Field>
        <Field id="password" name="password" label="Password" required>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />
        </Field>
      </div>
    </section>
  );
}

export { decodeOnboardError } from "@/lib/onboard-errors";
