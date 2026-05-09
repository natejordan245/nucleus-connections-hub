import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Heart, X } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { ExplainabilityPanel } from "@/components/ExplainabilityPanel";
import { Pill } from "@/components/Pill";
import { getDataStore } from "@/lib/data";
import type { BusinessDTO, CandidateDTO, InterestState } from "@/lib/data/types";
import { requireViewer } from "@/lib/viewer";
import { vote } from "./actions";

export default async function HandshakePage({
  searchParams,
}: {
  searchParams?: { with?: string };
}) {
  const { viewerId } = await requireViewer();
  const otherId = searchParams?.with;
  if (!otherId) notFound();

  const store = getDataStore();
  const [viewerCandidate, viewerBusiness, otherCandidate, otherBusiness] = await Promise.all([
    store.getCandidate(viewerId),
    store.getBusiness(viewerId),
    store.getCandidate(otherId),
    store.getBusiness(otherId),
  ]);

  const viewerKind: "candidate" | "business" | null = viewerCandidate
    ? "candidate"
    : viewerBusiness
      ? "business"
      : null;
  const otherKind: "candidate" | "business" | null = otherCandidate
    ? "candidate"
    : otherBusiness
      ? "business"
      : null;

  // Handshake is candidate↔business only. Mentor and Investor profiles never
  // enter this flow.
  if (!viewerKind || !otherKind || viewerKind === otherKind) {
    notFound();
  }

  const candidate: CandidateDTO = (viewerKind === "candidate" ? viewerCandidate : otherCandidate)!;
  const business: BusinessDTO = (viewerKind === "business" ? viewerBusiness : otherBusiness)!;
  const otherSummary =
    viewerKind === "candidate"
      ? { name: business.name, photo: business.logoUrl, headline: business.oneLiner }
      : { name: candidate.name, photo: candidate.photoUrl, headline: candidate.headline };

  const interest = await store.getInterest({ candidateId: candidate.id, businessId: business.id });
  const matches = await store.matchesFor(viewerId);
  const match = matches.find(
    (m) =>
      (viewerKind === "candidate" && m.candidateId === business.id) ||
      (viewerKind === "business" && m.candidateId === candidate.id),
  );

  const myState: InterestState =
    viewerKind === "candidate"
      ? interest?.talentState ?? "pending"
      : interest?.startupState ?? "pending";
  const theirState: InterestState =
    viewerKind === "candidate"
      ? interest?.startupState ?? "pending"
      : interest?.talentState ?? "pending";
  const isMutual = interest?.mutualAt !== null && interest?.mutualAt !== undefined;

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-8">
      <Link
        href="/dashboard"
        className="font-mono text-xs text-warmgray-500 hover:text-ink"
      >
        ← back to dashboard
      </Link>

      <header className="mt-4">
        <span className="eyebrow text-orange-500">Handshake</span>
        <h1 className="mt-2 text-2xl font-bold text-ink">
          {isMutual
            ? `You and ${otherSummary.name} are a mutual match.`
            : `Decide on ${otherSummary.name}.`}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-warmgray-500">
          {isMutual
            ? "We've sent the introduction to your CRM. Expect an outreach from the Nucleus team shortly."
            : "Mark interested if you'd like an introduction. Mark pass to remove this from your matches."}
        </p>
      </header>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-lg border border-warmgray-200 bg-white">
          <div className="flex items-center gap-3 border-b border-warmgray-200 px-4 py-3">
            <Avatar name={otherSummary.name} src={otherSummary.photo} size="md" />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-ink">
                <Link
                  href={`/profile/${viewerKind === "candidate" ? "business" : "candidate"}/${
                    viewerKind === "candidate" ? business.id : candidate.id
                  }`}
                  className="hover:text-orange-700"
                >
                  {otherSummary.name}
                </Link>
              </h2>
              <p className="truncate text-[11px] text-warmgray-500">
                {otherSummary.headline}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-warmgray-200 border-b border-warmgray-200">
            <StatusCell label="you" state={myState} />
            <StatusCell label="them" state={theirState} />
          </div>

          <div className="p-4">
            {isMutual ? (
              <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
                <strong>Mutual.</strong> A connector from Nucleus will introduce you
                over email shortly.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <form action={vote}>
                  <input type="hidden" name="candidateId" value={candidate.id} />
                  <input type="hidden" name="businessId" value={business.id} />
                  <input type="hidden" name="side" value={viewerKind} />
                  <input type="hidden" name="state" value="pass" />
                  <button
                    type="submit"
                    className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-warmgray-200 px-3 text-xs font-medium text-warmgray-700 transition hover:border-warmgray-300 hover:text-ink"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Pass
                  </button>
                </form>
                <form action={vote}>
                  <input type="hidden" name="candidateId" value={candidate.id} />
                  <input type="hidden" name="businessId" value={business.id} />
                  <input type="hidden" name="side" value={viewerKind} />
                  <input type="hidden" name="state" value="interested" />
                  <button
                    type="submit"
                    className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-orange-500 px-3 text-xs font-semibold text-white transition hover:bg-orange-600"
                  >
                    {myState === "interested" ? (
                      <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    ) : (
                      <Heart className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    )}
                    {myState === "interested" ? "Interested" : "Interested"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </section>

        {match ? (
          <ExplainabilityPanel match={match} />
        ) : (
          <section className="rounded-lg border border-warmgray-200 bg-white">
            <div className="border-b border-warmgray-200 px-4 py-2.5">
              <h2 className="text-sm font-semibold text-ink">Why was I matched?</h2>
            </div>
            <p className="p-4 text-sm text-warmgray-600">
              Match details aren't available for this pair yet.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

function StatusCell({ label, state }: { label: string; state: InterestState }) {
  const tone = state === "interested" ? "emerald" : state === "pass" ? "warmgray" : "neutral";
  const text = state === "pending" ? "awaiting" : state;
  return (
    <div className="px-4 py-3">
      <span className="font-mono text-[10px] uppercase tracking-wider text-warmgray-500">
        {label}
      </span>
      <div className="mt-1">
        <Pill tone={tone}>{text}</Pill>
      </div>
    </div>
  );
}
