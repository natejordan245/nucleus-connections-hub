import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Pill } from "@/components/Pill";
import { getDataStore } from "@/lib/data";
import { getSidebarViewer, requireViewer } from "@/lib/viewer";

export default async function AffinityPushPage() {
  const { viewerId } = await requireViewer();
  const sidebarViewer = await getSidebarViewer();
  const store = getDataStore();

  const [pushes, allTalent, allStartups] = await Promise.all([
    store.listAffinityPushes(),
    store.listTalent(),
    store.listStartups(),
  ]);

  return (
    <AppShell viewer={sidebarViewer}>
      <main className="mx-auto w-full max-w-5xl px-8 py-10">
        <span className="eyebrow text-orange-500">Activity</span>
        <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-ink">
          Mutual introductions.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-warmgray-600">
          When both sides say yes, the introduction is queued for the Nucleus
          team. This is the running log.
        </p>

        {pushes.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-warmgray-200 bg-white p-10 text-center">
            <p className="font-serif text-xl font-semibold text-ink">No introductions yet.</p>
            <p className="mt-2 text-sm text-warmgray-600">
              They'll show up here as they happen.
            </p>
          </div>
        ) : (
          <ul className="mt-8 divide-y divide-warmgray-100 overflow-hidden rounded-2xl border border-warmgray-100 bg-white shadow-sm">
            {pushes.map((p) => {
              const t = allTalent.find((t) => t.id === p.talentId);
              const s = allStartups.find((s) => s.id === p.startupId);
              const when = new Date(p.pushedAt).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              });
              return (
                <li key={p.id} className="p-5">
                  <div className="flex items-start gap-4">
                    <ArrowUpRight className="mt-0.5 h-5 w-5 text-orange-500" strokeWidth={1.75} aria-hidden />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-serif text-lg font-semibold text-ink">
                          {t?.name ?? p.talentId} ↔ {s?.name ?? p.startupId}
                        </h3>
                        <Pill tone={p.status === "pushed" ? "emerald" : "warmgray"}>{p.status}</Pill>
                      </div>
                      <p className="mt-1 text-xs text-warmgray-500">{when}</p>
                      <p className="mt-3 text-sm leading-relaxed text-warmgray-700">{p.reason}</p>

                      {(t || s) && (
                        <div className="mt-3 flex flex-wrap gap-3 text-xs">
                          {t && (
                            <Link
                              href={`/profile/talent/${t.id}`}
                              className="font-medium text-orange-600 hover:text-orange-700"
                            >
                              View {t.name} →
                            </Link>
                          )}
                          {s && (
                            <Link
                              href={`/profile/startup/${s.id}`}
                              className="font-medium text-orange-600 hover:text-orange-700"
                            >
                              View {s.name} →
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </AppShell>
  );
}
