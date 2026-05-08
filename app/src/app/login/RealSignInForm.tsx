"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string };

export function RealSignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "sending" });
    try {
      const sb = getSupabaseBrowserClient();
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) {
        setStatus({ kind: "error", message: error.message });
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : "Unexpected error" });
    }
  }

  async function handleMagicLink() {
    if (!email) {
      setStatus({ kind: "error", message: "Email required for magic link." });
      return;
    }
    setStatus({ kind: "sending" });
    try {
      const sb = getSupabaseBrowserClient();
      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) {
        setStatus({ kind: "error", message: error.message });
        return;
      }
      setStatus({ kind: "sent" });
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : "Unexpected error" });
    }
  }

  return (
    <form onSubmit={handlePassword} className="space-y-4">
      <div>
        <label className="eyebrow text-warmgray-500" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-warmgray-200 bg-white px-3 py-2 text-sm text-ink outline-none ring-orange-300/0 transition focus:border-orange-400 focus:ring-2 focus:ring-orange-300/40"
        />
      </div>
      <div>
        <label className="eyebrow text-warmgray-500" htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-warmgray-200 bg-white px-3 py-2 text-sm text-ink outline-none ring-orange-300/0 transition focus:border-orange-400 focus:ring-2 focus:ring-orange-300/40"
        />
      </div>

      {status.kind === "error" && (
        <p className="text-sm text-red-600">{status.message}</p>
      )}
      {status.kind === "sent" && (
        <p className="text-sm text-emerald-700">
          Check your email for the magic link.
        </p>
      )}

      <div className="flex flex-col gap-2 pt-2">
        <button
          type="submit"
          disabled={status.kind === "sending"}
          className="inline-flex h-10 items-center justify-center rounded-full bg-orange-500 px-5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(255,114,39,0.55)] transition hover:bg-orange-600 disabled:opacity-60"
        >
          {status.kind === "sending" ? "Signing in…" : "Sign in"}
        </button>
        <button
          type="button"
          onClick={handleMagicLink}
          disabled={status.kind === "sending"}
          className="inline-flex h-10 items-center justify-center rounded-full border border-warmgray-200 bg-white px-5 text-sm font-medium text-warmgray-700 transition hover:border-warmgray-300 hover:text-ink disabled:opacity-60"
        >
          Email me a magic link instead
        </button>
      </div>
    </form>
  );
}
