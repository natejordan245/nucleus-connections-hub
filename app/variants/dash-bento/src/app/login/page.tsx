import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell, FieldLabel, PrimaryButton, TextInput } from "@/components/AuthCard";
import { getAppMode } from "@/lib/mode";
import { getViewer } from "@/lib/session";
import { signIn } from "./actions";

export default async function LoginPage({
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
          Sign in
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-warmgray-600">
          Welcome back to Nucleus Connections Hub.
        </p>

        <form action={signIn} className="mt-6 space-y-4">
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
            <TextInput
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required={mode === "live"}
              placeholder="••••••••"
            />
          </div>

          {error && <ErrorBanner message={decodeError(error)} />}

          <div className="pt-2">
            <PrimaryButton type="submit">Sign in</PrimaryButton>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-warmgray-600">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-orange-600 hover:text-orange-700">
            Sign up
          </Link>
        </p>

        {mode === "demo" && (
          <p className="mt-3 text-center text-xs text-warmgray-400">
            <Link href="/login/personas" className="hover:text-warmgray-600">
              Or browse as a sample user →
            </Link>
          </p>
        )}
      </section>
    </AuthShell>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </p>
  );
}

function decodeError(raw: string): string {
  if (raw === "missing_credentials") return "Email and password are required.";
  if (raw === "missing_code") return "Sign-in link was invalid. Try again.";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
