import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CandidateProfileCard } from "@/components/CandidateProfileCard";
import { ExplainabilityPanel } from "@/components/ExplainabilityPanel";
import { getDataStore } from "@/lib/data";
import { maybeViewer } from "@/lib/viewer";

export default async function CandidateProfilePage({ params }: { params: { id: string } }) {
  const { viewerId } = await maybeViewer();
  const store = getDataStore();
  const candidate = await store.getCandidate(params.id);
  if (!candidate) notFound();

  const matches = viewerId ? await store.matchesFor(viewerId) : [];
  const match = matches.find(
    (m) => m.candidateId === candidate.id && m.candidateKind === "candidate",
  );
  const isOwner = viewerId === candidate.id;

  const headerAction = isOwner ? (
    <Link
      href="/onboard/candidate"
      className="inline-flex items-center gap-1 rounded-md border border-warmgray-200 px-2.5 py-1.5 text-xs font-medium text-warmgray-700 hover:border-warmgray-300"
    >
      Edit profile
    </Link>
  ) : viewerId && match ? (
    <Link
      href={`/handshake?with=${candidate.id}`}
      className="inline-flex h-7 items-center rounded-md bg-ink px-2.5 text-[11px] font-semibold text-white transition hover:bg-warmgray-800"
    >
      Open handshake →
    </Link>
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
