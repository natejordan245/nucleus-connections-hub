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
      <main className="mx-auto w-full max-w-4xl px-8 py-10">
        <Link href="/dashboard" className="text-sm font-medium text-warmgray-600 hover:text-ink">
          ← Back to matches
        </Link>

        <header className="mt-6">
          <span className="eyebrow text-orange-500">Handshake</span>
          <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-ink">
            {isMutual ? `You and ${otherSummary.name} are a mutual match.` : `Decide on ${otherSummary.name}.`}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-warmgray-600">
            {isMutual
              ? "We've sent the introduction to your CRM. Expect an outreach from the Nucleus team shortly."
              : "Mark interested if you'd like an introduction. Mark pass to remove this from your matches."}
          </p>
        </header>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-2xl border border-warmgray-100 bg-white p-6 shadow-sm">
            <header className="flex items-center gap-4">
              <Avatar name={otherSummary.name} src={otherSummary.photo} size="md" />
              <div>
                <h2 className="font-serif text-lg font-semibold text-ink">
                  <Link
                    href={`/profile/${viewerKind === "candidate" ? "business" : "candidate"}/${
                      viewerKind === "candidate" ? business.id : candidate.id
                    }`}
                    className="hover:text-orange-700"
                  >
                    {otherSummary.name}
                  </Link>
                </h2>
                <p className="text-xs text-warmgray-600">{otherSummary.headline}</p>
              </div>
            </header>

            <div className="mt-6 grid grid-cols-2 gap-4 text-xs">
              <StatusPill label="You" state={myState} />
              <StatusPill label="Them" state={theirState} />
            </div>

            {isMutual ? (
              <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                <strong>Mutual.</strong> A connector from Nucleus will introduce you over email
                shortly.
              </p>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-3">
                <form action={vote}>
                  <input type="hidden" name="candidateId" value={candidate.id} />
                  <input type="hidden" name="businessId" value={business.id} />
                  <input type="hidden" name="side" value={viewerKind} />
                  <input type="hidden" name="state" value="pass" />
                  <button
                    type="submit"
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-warmgray-200 bg-white px-4 text-sm font-medium text-warmgray-700 transition hover:border-warmgray-300 hover:text-ink"
                  >
                    <X className="h-4 w-4" strokeWidth={2} aria-hidden /> Pass
                  </button>
                </form>
                <form action={vote}>
                  <input type="hidden" name="candidateId" value={candidate.id} />
                  <input type="hidden" name="businessId" value={business.id} />
                  <input type="hidden" name="side" value={viewerKind} />
                  <input type="hidden" name="state" value="interested" />
                  <button
                    type="submit"
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-orange-500 px-4 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(255,114,39,0.55)] transition hover:bg-orange-600"
                  >
                    {myState === "interested" ? <Check className="h-4 w-4" strokeWidth={2} aria-hidden /> : <Heart className="h-4 w-4" strokeWidth={2} aria-hidden />}
                    {myState === "interested" ? "You're interested" : "Interested"}
                  </button>
                </form>
              </div>
            )}
          </section>

          {match ? (
            <ExplainabilityPanel match={match} />
          ) : (
            <section className="rounded-2xl border border-warmgray-100 bg-white p-6 shadow-sm">
              <span className="eyebrow text-warmgray-500">Why was I matched?</span>
              <p className="mt-3 text-sm text-warmgray-600">
                Match details aren't available for this pair yet.
              </p>
            </section>
          )}
        </div>
      </main>
  );
}

function StatusPill({ label, state }: { label: string; state: InterestState }) {
  const tone = state === "interested" ? "emerald" : state === "pass" ? "warmgray" : "neutral";
  const text = state === "pending" ? "Awaiting" : state;
  return (
    <div className="rounded-xl border border-warmgray-100 bg-paper p-3">
      <span className="eyebrow text-warmgray-400">{label}</span>
      <div className="mt-1">
        <Pill tone={tone}>{text}</Pill>
      </div>
    </div>
  );
}
