import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell, FieldLabel, PrimaryButton, TextInput } from "@/components/AuthCard";
import { PasswordInput } from "@/components/PasswordInput";
import { getAppMode } from "@/lib/mode";
import { getViewer } from "@/lib/session";
import { signUp } from "@/app/login/actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const viewer = await getViewer();
  if (viewer.kind !== "anon") redirect("/profile");

  const mode = getAppMode();
  const error = searchParams?.error;

  return (
    <AuthShell>
      <section className="w-full rounded-2xl border border-warmgray-100 bg-white p-8 shadow-sm">
        <h1 className="font-serif text-3xl font-semibold leading-tight text-ink">
          Create your account
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-warmgray-600">
          {mode === "demo"
            ? "Demo mode — any email gets you in instantly."
            : "Two-line setup. You'll be inside in a few seconds."}
        </p>

        <form action={signUp} className="mt-6 space-y-4">
          <div>
            <FieldLabel htmlFor="name">Your name</FieldLabel>
            <TextInput id="name" name="name" type="text" autoComplete="name" placeholder="Jane Operator" />
          </div>
          <div>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <TextInput
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required={mode === "live"}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              required={mode === "live"}
              minLength={mode === "live" ? 8 : undefined}
              placeholder="At least 8 characters"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error === "missing_credentials"
                ? "Email and password are required."
                : decodeURIComponent(error)}
            </p>
          )}

          <div className="pt-2">
            <PrimaryButton type="submit">Create account</PrimaryButton>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-warmgray-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-orange-600 hover:text-orange-700">
            Sign in
          </Link>
        </p>
      </section>
    </AuthShell>
  );
}
