import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CandidateProfileCard } from "@/components/CandidateProfileCard";
import { ExplainabilityPanel } from "@/components/ExplainabilityPanel";
import { InterestActions } from "@/components/InterestActions";
import { MatchScorePill } from "@/components/MatchScorePill";
import { getDataStore } from "@/lib/data";
import { maybeViewer } from "@/lib/viewer";

export default async function CandidateProfilePage({ params }: { params: { id: string } }) {
  const { viewerId } = await maybeViewer();
  const store = getDataStore();
  const candidate = await store.getCandidate(params.id);
  if (!candidate) notFound();

  const isOwner = viewerId === candidate.id;
  const [match, viewerBusiness] = await Promise.all([
    viewerId && !isOwner
      ? store.computeMatch({ subjectId: viewerId, candidateId: candidate.id })
      : Promise.resolve(null),
    viewerId ? store.getBusiness(viewerId) : Promise.resolve(null),
  ]);
  const canRequestIntro = Boolean(viewerBusiness) && !isOwner;
  const interest = canRequestIntro
    ? await store.getInterest({ candidateId: candidate.id, businessId: viewerBusiness!.id })
    : null;
  const alreadyRequested = interest?.startupState === "interested";
  const alreadyPassed = interest?.startupState === "pass";

  const headerAction = isOwner ? (
    <Link
      href="/onboard/candidate"
      className="inline-flex items-center gap-1 rounded-md border border-warmgray-200 px-2.5 py-1.5 text-xs font-medium text-warmgray-700 hover:border-warmgray-300"
    >
      Edit profile
    </Link>
  ) : (
    <div className="flex flex-col items-end gap-2">
      {match && <MatchScorePill score={match.score} />}
      {canRequestIntro && (
        <InterestActions
          candidateId={candidate.id}
          businessId={viewerBusiness!.id}
          side="business"
          alreadyInterested={alreadyRequested}
          alreadyPassed={alreadyPassed}
        />
      )}
    </div>
  );

  // Owners viewing their own profile don't get a "why was I matched" aside —
  // there's nothing to explain. Layout falls back to single-column.
  const aside = isOwner ? undefined : match ? (
    <ExplainabilityPanel match={match} />
  ) : (
    <section className="rounded-lg border border-warmgray-200 bg-white">
      <div className="border-b border-warmgray-200 px-4 py-2.5">
        <h2 className="text-sm font-semibold text-ink">Why was I matched?</h2>
      </div>
      <div className="p-4">
        <p className="text-sm text-warmgray-600">
          This profile isn't currently in your matches.
        </p>
      </div>
    </section>
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-8">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Candidate" },
          { label: candidate.name },
        ]}
      />
      <CandidateProfileCard candidate={candidate} headerAction={headerAction} aside={aside} />
    </main>
  );
}
