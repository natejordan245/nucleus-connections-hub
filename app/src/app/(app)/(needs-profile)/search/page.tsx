import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { Pill } from "@/components/Pill";
import { getDataStore } from "@/lib/data";
import { SECTOR_LABELS } from "@/lib/data/enum-labels";
import type {
  BusinessDTO,
  CandidateDTO,
  InvestorDTO,
  MentorDTO,
  ResourceDTO,
} from "@/lib/data/types";

type Tab = "people" | "companies" | "mentors" | "investors" | "resources";

const TABS: { value: Tab; label: string }[] = [
  { value: "people",    label: "People"     },
  { value: "companies", label: "Companies"  },
  { value: "mentors",   label: "Mentors"    },
  { value: "investors", label: "VCs"        },
  { value: "resources", label: "Resources"  },
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: { q?: string; kind?: string };
}) {
  const q = searchParams?.q ?? "";
  // Map URL kind values: `business` is also accepted as a synonym for `companies`.
  const tab: Tab =
    searchParams?.kind === "companies" || searchParams?.kind === "business"
      ? "companies"
      : searchParams?.kind === "mentors" || searchParams?.kind === "mentor"
        ? "mentors"
        : searchParams?.kind === "investors" || searchParams?.kind === "investor"
          ? "investors"
          : searchParams?.kind === "resources"
            ? "resources"
            : "people";

  const store = getDataStore();
  const results = await store.search(q);

  const counts: Record<Tab, number> = {
    people: results.candidates.length,
    companies: results.businesses.length,
    mentors: results.mentors.length,
    investors: results.investors.length,
    resources: results.resources.length,
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-8 py-10">
      <span className="eyebrow text-orange-500">Search</span>
      <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-ink">
        Find people, companies, and resources.
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-warmgray-600">
        Search across the network — operators, businesses, mentors, VCs, and the
        playbooks Nucleus has gathered.
      </p>

      <form
        action="/search"
        method="GET"
        className="mt-8 flex items-center gap-3 rounded-2xl border border-warmgray-100 bg-white p-2 shadow-sm focus-within:border-orange-300"
      >
        <SearchIcon
          className="ml-2 h-5 w-5 shrink-0 text-warmgray-400"
          strokeWidth={1.75}
          aria-hidden
        />
        <input
          type="search"
          name="q"
          defaultValue={q}
          autoFocus
          placeholder="Try “bioengineering”, “GTM”, “seed”, or “Lehi”…"
          className="flex-1 bg-transparent px-1 py-2 text-sm text-ink outline-none placeholder:text-warmgray-400"
        />
        <input type="hidden" name="kind" value={tab} />
        <button
          type="submit"
          className="inline-flex h-9 items-center justify-center rounded-full bg-ink px-4 text-xs font-semibold text-white transition hover:bg-warmgray-800"
        >
          Search
        </button>
      </form>

      <nav className="mt-6 flex flex-wrap items-center gap-1 border-b border-warmgray-100">
        {TABS.map((t) => {
          const active = t.value === tab;
          const href = `/search?kind=${t.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
          return (
            <Link
              key={t.value}
              href={href}
              className={
                "relative inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition " +
                (active
                  ? "text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-orange-500"
                  : "text-warmgray-600 hover:text-ink")
              }
            >
              {t.label}
              <span
                className={
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                  (active ? "bg-orange-50 text-orange-700" : "bg-warmgray-50 text-warmgray-500")
                }
              >
                {counts[t.value]}
              </span>
            </Link>
          );
        })}
      </nav>

      <section className="mt-6">
        {tab === "people" && <PeopleResults items={results.candidates} q={q} />}
        {tab === "companies" && <CompanyResults items={results.businesses} q={q} />}
        {tab === "mentors" && <MentorResults items={results.mentors} q={q} />}
        {tab === "investors" && <InvestorResults items={results.investors} q={q} />}
        {tab === "resources" && <ResourceResults items={results.resources} q={q} />}
      </section>
    </main>
  );
}

function EmptyState({ kind, q }: { kind: string; q: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-warmgray-200 bg-white p-10 text-center">
      <p className="font-serif text-lg font-semibold text-ink">
        {q ? `No ${kind} match “${q}”.` : `No ${kind} yet.`}
      </p>
      <p className="mt-2 text-sm text-warmgray-600">
        {q ? "Try a different term, or switch tabs." : "Check back soon."}
      </p>
    </div>
  );
}

function PeopleResults({ items, q }: { items: CandidateDTO[]; q: string }) {
  if (items.length === 0) return <EmptyState kind="people" q={q} />;
  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {items.map((c) => (
        <li key={c.id}>
          <Link
            href={`/profile/candidate/${c.id}`}
            className="flex h-full gap-4 rounded-2xl border border-warmgray-100 bg-white p-5 shadow-sm transition hover:border-warmgray-200"
          >
            <Avatar name={c.name} src={c.photoUrl} size="md" />
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-serif text-lg font-semibold text-ink">
                {c.name}
              </h3>
              <p className="truncate text-xs text-warmgray-600">{c.headline}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Pill tone="warmgray">{c.location}</Pill>
                {c.domains.slice(0, 2).map((d) => (
                  <Pill key={d} tone="orange">
                    {SECTOR_LABELS[d]}
                  </Pill>
                ))}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function CompanyResults({ items, q }: { items: BusinessDTO[]; q: string }) {
  if (items.length === 0) return <EmptyState kind="companies" q={q} />;
  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {items.map((s) => (
        <li key={s.id}>
          <Link
            href={`/profile/business/${s.id}`}
            className="flex h-full gap-4 rounded-2xl border border-warmgray-100 bg-white p-5 shadow-sm transition hover:border-warmgray-200"
          >
            <Avatar name={s.name} src={s.logoUrl} size="md" />
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-serif text-lg font-semibold text-ink">
                {s.name}
              </h3>
              <p className="truncate text-xs text-warmgray-600">{s.oneLiner}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Pill tone="warmgray">{s.location}</Pill>
                <Pill tone="orange">{SECTOR_LABELS[s.sector]}</Pill>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function MentorResults({ items, q }: { items: MentorDTO[]; q: string }) {
  if (items.length === 0) return <EmptyState kind="mentors" q={q} />;
  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {items.map((m) => (
        <li key={m.id}>
          <Link
            href={`/profile/mentor/${m.id}`}
            className="flex h-full gap-4 rounded-2xl border border-warmgray-100 bg-white p-5 shadow-sm transition hover:border-warmgray-200"
          >
            <Avatar name={m.name} src={m.photoUrl} size="md" />
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-serif text-lg font-semibold text-ink">
                {m.name}
              </h3>
              <p className="truncate text-xs text-warmgray-600">{m.headline}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Pill tone="warmgray">{m.location}</Pill>
                <Pill tone="orange">{m.hoursPerMonth} hrs/mo</Pill>
                {m.boardSeatOpen && <Pill tone="emerald">Board OK</Pill>}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function InvestorResults({ items, q }: { items: InvestorDTO[]; q: string }) {
  if (items.length === 0) return <EmptyState kind="VCs" q={q} />;
  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {items.map((i) => (
        <li key={i.id}>
          <Link
            href={`/profile/investor/${i.id}`}
            className="flex h-full gap-4 rounded-2xl border border-warmgray-100 bg-white p-5 shadow-sm transition hover:border-warmgray-200"
          >
            <Avatar name={i.fundName ?? i.name} src={i.photoUrl} size="md" />
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-serif text-lg font-semibold text-ink">
                {i.fundName ?? i.name}
              </h3>
              <p className="truncate text-xs text-warmgray-600">{i.headline}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Pill tone="warmgray">{i.location}</Pill>
                {i.sectorsInvested.slice(0, 2).map((s) => (
                  <Pill key={s} tone="orange">
                    {SECTOR_LABELS[s]}
                  </Pill>
                ))}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ResourceResults({ items, q }: { items: ResourceDTO[]; q: string }) {
  if (items.length === 0) return <EmptyState kind="resources" q={q} />;
  return (
    <ul className="grid grid-cols-1 gap-3">
      {items.map((r) => (
        <li key={r.id}>
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl border border-warmgray-100 bg-white p-5 shadow-sm transition hover:border-warmgray-200"
          >
            <div className="flex items-center gap-2">
              <Pill tone="orange">{r.kind}</Pill>
              <span className="text-xs text-warmgray-500">{r.uploadedByName}</span>
            </div>
            <h3 className="mt-2 font-serif text-lg font-semibold text-ink">
              {r.title}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-warmgray-700">
              {r.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {r.tags.map((tag) => (
                <Pill key={tag} tone="warmgray">
                  {tag}
                </Pill>
              ))}
            </div>
          </a>
        </li>
      ))}
    </ul>
  );
}
