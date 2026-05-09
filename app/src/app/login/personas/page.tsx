import { notFound, redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthCard";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DEMO_PERSONAS, getAppMode } from "@/lib/mode";
import { getViewer } from "@/lib/session";
import { signInAsDemoPersona } from "@/app/login/actions";

export default async function PersonasPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  if (getAppMode() !== "demo") notFound();
  const viewer = await getViewer();
  if (viewer.kind !== "anon") redirect("/dashboard");

  return (
    <AuthShell>
      <section className="w-full rounded-2xl border border-warmgray-100 bg-white p-8 shadow-sm">
        <Breadcrumb
          items={[
            { label: "Sign in", href: "/login" },
            { label: "Sample users" },
          ]}
        />
        <span className="eyebrow mt-4 block text-orange-500">Sample users</span>
        <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-ink">
          Pick a profile.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-warmgray-600">
          Step into someone's shoes to see their matches and introductions.
        </p>

        {searchParams?.error === "unknown_persona" && (
          <p className="mt-4 text-sm text-red-600">
            That profile wasn't recognized — pick from the list below.
          </p>
        )}

        <ul className="mt-6 space-y-3">
          {DEMO_PERSONAS.map((p) => (
            <li key={p.id}>
              <form action={signInAsDemoPersona}>
                <input type="hidden" name="personaId" value={p.id} />
                <button
                  type="submit"
                  className="group flex w-full items-center justify-between rounded-xl border border-warmgray-100 bg-paper px-4 py-3 text-left transition hover:border-orange-300 hover:bg-orange-50/40"
                >
                  <span>
                    <span className="block text-sm font-semibold text-ink">{p.name}</span>
                    <span className="eyebrow mt-0.5 block text-warmgray-400">{p.role}</span>
                  </span>
                  <span
                    aria-hidden
                    className="text-warmgray-300 transition group-hover:translate-x-0.5 group-hover:text-orange-500"
                  >
                    →
                  </span>
                </button>
              </form>
            </li>
          ))}
        </ul>

      </section>
    </AuthShell>
  );
}
