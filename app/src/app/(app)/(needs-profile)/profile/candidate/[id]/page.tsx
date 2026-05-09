import { notFound } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CandidateProfileCard } from "@/components/CandidateProfileCard";
import { ExplainabilityPanel } from "@/components/ExplainabilityPanel";
import { getDataStore } from "@/lib/data";
import { maybeViewer } from "@/lib/viewer";
import { requestIntro } from "../../actions";

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

  const headerAction = isOwner ? (
    <Link
      href="/onboard/candidate"
      className="inline-flex items-center gap-1 rounded-md border border-warmgray-200 px-2.5 py-1.5 text-xs font-medium text-warmgray-700 hover:border-warmgray-300"
    >
      Edit profile
    </Link>
  ) : canRequestIntro ? (
    <form action={requestIntro}>
      <input type="hidden" name="candidateId" value={candidate.id} />
      <input type="hidden" name="businessId" value={viewerBusiness!.id} />
      <input type="hidden" name="side" value="business" />
      <input type="hidden" name="state" value="interested" />
      <button
        type="submit"
        disabled={alreadyRequested}
        className="group inline-flex h-7 items-center gap-1.5 rounded-md bg-ink px-2.5 text-[11px] font-semibold text-white transition hover:bg-warmgray-800 disabled:cursor-default disabled:opacity-80 disabled:hover:bg-ink"
      >
        {alreadyRequested ? (
          <>
            <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Requested
          </>
        ) : (
          <>
            Request intro
            <span aria-hidden className="transition group-hover:translate-x-0.5">
              →
            </span>
          </>
        )}
      </button>
    </form>
  ) : null;

  const aside = match ? (
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
