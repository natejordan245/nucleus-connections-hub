import { Code2, Plus } from "lucide-react";
import { InteractiveEmbedMock } from "./InteractiveEmbedMock";

const NETWORKS = [
  "Operator Network",
  "Mentor Network",
  "Subject-Matter Expert Advisory Network",
  "Venture Network",
  "Service Provider Network",
];

/**
 * Slide — distribution.
 *
 * Shows the embed widget the way a partner would see it: dropped into
 * the live Nucleus Utah contact page. The frame is a mock (no real
 * iframe — keeps the slide deterministic), but the form inside is
 * interactive enough to walk through Step 1 → Step 2.
 */
export default function DistributionSlidePage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 pt-12 pb-24">
      <span className="eyebrow text-orange-500">Distribution</span>
      <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.01em] text-ink">
        Drop the form into any site.
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-warmgray-600">
        One snippet. Lives inside the partner&apos;s own page — Nucleus, BioHive, a
        Stoke Mtn launch site.{" "}
        <span className="text-warmgray-500">(Squarespace compatible.)</span>
      </p>

      <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-warmgray-200 bg-white px-3 py-1.5 font-mono text-[11px] text-warmgray-700">
        <Code2 className="h-3.5 w-3.5 text-orange-600" strokeWidth={2} aria-hidden />
        <span className="text-warmgray-500">&lt;script src=</span>
        <span className="text-ink">"connections.utah/embed.js"</span>
        <span className="text-warmgray-500">&gt;&lt;/script&gt;</span>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-warmgray-200 bg-warmgray-50 shadow-[0_30px_60px_-30px_rgba(15,23,42,0.25)]">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-warmgray-200 bg-white px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-warmgray-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-warmgray-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-warmgray-200" />
          </div>
          <div className="ml-3 flex-1 truncate rounded-md bg-warmgray-100 px-3 py-1 font-mono text-[11px] text-warmgray-600">
            nucleusutah.org/contact
          </div>
        </div>

        {/* Mock Nucleus Utah contact section — deep navy panel matching the
            real page at https://www.nucleusutah.org/contact. */}
        <div className="bg-[#1f2f8a] px-6 py-10 text-white sm:px-10 sm:py-12">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
            {/* Left: heading + welcome paragraph + networks accordion list */}
            <div>
              <h2 className="font-serif text-[40px] font-semibold italic leading-[1.05] tracking-[-0.01em] sm:text-[56px]">
                Connections
                <br />
                Hub
              </h2>
              <p className="mt-5 max-w-md text-[13px] leading-relaxed text-white/80">
                Welcome to the Nucleus Institute&apos;s contact hub. We believe in
                bringing together leaders, mentors, and innovators to create
                something extraordinary. Whether you&apos;re looking to join our
                executive talent pool, share your expertise as a mentor, or
                become part of our global investor community, you&apos;re in the
                right place.
              </p>

              <ul className="mt-8 divide-y divide-white/15 border-t border-white/15">
                {NETWORKS.map((name) => (
                  <li
                    key={name}
                    className="flex items-center justify-between py-3.5 text-[13px] font-medium text-white/90"
                  >
                    <span>{name}</span>
                    <Plus className="h-4 w-4 text-white/70" strokeWidth={1.75} aria-hidden />
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: embedded widget — interactive on click */}
            <div className="lg:pt-2">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-white/80">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                live embed · powered by Connections Hub
              </div>
              <InteractiveEmbedMock />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
