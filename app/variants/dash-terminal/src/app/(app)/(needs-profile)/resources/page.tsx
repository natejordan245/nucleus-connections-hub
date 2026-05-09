import { ArrowUpRight, Plus } from "lucide-react";
import { Pill } from "@/components/Pill";
import { getDataStore } from "@/lib/data";

export default async function ResourcesPage() {
  const store = getDataStore();
  const resources = await store.listResources();

  return (
    <main className="mx-auto w-full max-w-5xl px-8 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow text-orange-500">Resources</span>
          <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-ink">
            Playbooks the network has shared.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-warmgray-600">
            Guides, decks, and primers from operators, founders, and the
            Nucleus team. Use them to close gaps before your next intro.
          </p>
        </div>

        <button
          type="button"
          disabled
          title="Uploads coming soon"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-orange-500 px-5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.55)] transition hover:bg-orange-600 disabled:opacity-60"
        >
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden /> Upload
        </button>
      </div>

      {resources.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-warmgray-200 bg-white p-10 text-center">
          <p className="font-serif text-xl font-semibold text-ink">
            No resources yet.
          </p>
          <p className="mt-2 text-sm text-warmgray-600">
            Uploads land here. Anyone in the network can contribute.
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {resources.map((r) => (
            <li key={r.id}>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full flex-col rounded-2xl border border-warmgray-100 bg-white p-6 shadow-sm transition hover:border-warmgray-200"
              >
                <div className="flex items-center gap-2">
                  <Pill tone="orange">{r.kind}</Pill>
                  <span className="text-xs text-warmgray-500">
                    by {r.uploadedByName}
                  </span>
                </div>

                <h3 className="mt-3 font-serif text-lg font-semibold text-ink">
                  {r.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-warmgray-700">
                  {r.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {r.tags.map((tag) => (
                    <Pill key={tag} tone="warmgray">
                      {tag}
                    </Pill>
                  ))}
                </div>

                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-orange-600 transition group-hover:text-orange-700">
                  Open resource
                  <ArrowUpRight
                    className="h-3.5 w-3.5"
                    strokeWidth={2}
                    aria-hidden
                  />
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
