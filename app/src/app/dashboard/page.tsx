import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { getDataStore } from "@/lib/data";
import { getSidebarViewer, requireViewer } from "@/lib/viewer";

export default async function DashboardPage() {
  const { viewer, viewerId } = await requireViewer();
  const sidebarViewer = await getSidebarViewer();

  const store = getDataStore();
  const [talent, startup, matches, interests, notifications] = await Promise.all([
    store.getTalent(viewerId),
    store.getStartup(viewerId),
    store.matchesFor(viewerId),
    store.listInterests(viewerId),
    store.listNotifications(viewerId),
  ]);

  const topMatches = matches.slice(0, 3);
  const topMatchSummaries = await Promise.all(
    topMatches.map((m) => loadCandidateSummary(m.candidateKind, m.candidateId)),
  );

  const profileName =
    talent?.name ??
    startup?.name ??
    (viewer.kind === "live" ? viewer.email?.split("@")[0] : null) ??
    "there";

  const role = talent ? "Your home" : startup ? "Founder home" : "Welcome";

  const mutualCount = interests.filter((i) => i.mutualAt !== null).length;
  const unreadCount = notifications.filter((n) => n.readAt === null).length;
  const hasProfile = Boolean(talent || startup);

  return (
    <AppShell viewer={sidebarViewer}>
      <main className="mx-auto w-full max-w-6xl px-8 py-10">
        <span className="eyebrow text-orange-500">{role}</span>
        <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-ink">
          Welcome, {profileName}.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-warmgray-600">
          {hasProfile
            ? "Here's what's happening across your matches and introductions."
            : "Tell us a bit about yourself and we'll start surfacing matches."}
        </p>

        <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Stat label="New matches" value={String(matches.length)} href="/matches" />
          <Stat label="Mutual introductions" value={String(mutualCount)} href="/affinity-push" />
          <Stat label="Unread notifications" value={String(unreadCount)} />
        </dl>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
          <section>
            <div className="flex items-end justify-between">
              <h2 className="font-serif text-2xl font-semibold text-ink">Top matches</h2>
              <Link href="/matches" className="text-sm font-medium text-orange-600 hover:text-orange-700">
                See all →
              </Link>
            </div>
            {matches.length === 0 ? (
              <EmptyState
                title={hasProfile ? "Matches are being prepared." : "Complete your profile first."}
                hint={
                  hasProfile
                    ? "We refresh as people in your network update theirs."
                    : "Two minutes of input is all we need to start ranking."
                }
                cta={hasProfile ? null : { label: "Complete profile", href: "/onboard" }}
              />
            ) : (
              <ul className="mt-4 space-y-3">
                {topMatches.map((m, idx) => {
                  const card = topMatchSummaries[idx];
                  return (
                    <li key={m.id}>
                      <Link
                        href={`/profile/${m.candidateKind}/${m.candidateId}`}
                        className="flex items-center justify-between rounded-2xl border border-warmgray-100 bg-white p-4 transition hover:border-warmgray-200"
                      >
                        <span className="flex items-center gap-3 min-w-0">
                          <Avatar name={card.name} src={card.photo} size="md" />
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-ink">{card.name}</span>
                            <span className="block truncate text-xs text-warmgray-600">
                              {card.headline}
                            </span>
                          </span>
                        </span>
                        <span className="ml-4 inline-flex items-center gap-2">
                          <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
                            {Math.round(m.score * 100)}%
                          </span>
                          <span aria-hidden className="text-warmgray-300">→</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <aside>
            <h2 className="font-serif text-2xl font-semibold text-ink">Next steps</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {hasProfile ? (
                <li className="rounded-2xl border border-warmgray-100 bg-white p-4">
                  <p className="font-semibold text-ink">Refine your profile</p>
                  <p className="mt-1 text-xs text-warmgray-600">
                    Adjust what you're looking for to sharpen your matches.
                  </p>
                  <Link
                    href={`/profile/${talent ? "talent" : "startup"}/${viewerId}`}
                    className="mt-2 inline-block text-xs font-medium text-orange-600 hover:text-orange-700"
                  >
                    Open profile →
                  </Link>
                </li>
              ) : (
                <li className="rounded-2xl border border-warmgray-100 bg-white p-4">
                  <p className="font-semibold text-ink">Tell us about yourself</p>
                  <p className="mt-1 text-xs text-warmgray-600">
                    Two minutes for the matches to start coming in.
                  </p>
                  <Link
                    href="/onboard"
                    className="mt-2 inline-block text-xs font-medium text-orange-600 hover:text-orange-700"
                  >
                    Get started →
                  </Link>
                </li>
              )}
              <li className="rounded-2xl border border-warmgray-100 bg-white p-4">
                <p className="font-semibold text-ink">Browse the network</p>
                <p className="mt-1 text-xs text-warmgray-600">
                  Search Utah's startups and talent directly.
                </p>
                <Link
                  href="/matches"
                  className="mt-2 inline-block text-xs font-medium text-orange-600 hover:text-orange-700"
                >
                  Open matches →
                </Link>
              </li>
            </ul>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}

async function loadCandidateSummary(kind: "talent" | "startup", id: string) {
  const store = getDataStore();
  if (kind === "talent") {
    const t = await store.getTalent(id);
    return {
      name: t?.name ?? id,
      headline: t?.headline ?? "",
      photo: t?.photoUrl,
    };
  }
  const s = await store.getStartup(id);
  return {
    name: s?.name ?? id,
    headline: s?.oneLiner ?? "",
    photo: s?.logoUrl,
  };
}

function Stat({ label, value, href }: { label: string; value: string; href?: string }) {
  const body = (
    <div className="rounded-2xl border border-warmgray-100 bg-white p-5 transition hover:border-warmgray-200">
      <dt className="eyebrow text-warmgray-400">{label}</dt>
      <dd className="mt-2 font-serif text-3xl font-semibold text-ink">{value}</dd>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

function EmptyState({
  title,
  hint,
  cta,
}: {
  title: string;
  hint: string;
  cta: { label: string; href: string } | null;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-warmgray-200 bg-white p-8 text-center">
      <p className="font-serif text-lg font-semibold text-ink">{title}</p>
      <p className="mt-2 text-sm text-warmgray-600">{hint}</p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-orange-500 px-5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(255,114,39,0.55)] transition hover:bg-orange-600"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
