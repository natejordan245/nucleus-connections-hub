import { DelicateArch } from "@/components/DelicateArch";

const COLUMNS: Array<{
  eyebrow: string;
  title: string;
  items: string[];
}> = [
  {
    eyebrow: "Lessons learned",
    title: "What surprised us.",
    items: [
      "Sample lesson one.",
      "Sample lesson two.",
      "Sample lesson three.",
    ],
  },
  {
    eyebrow: "Proud of",
    title: "What we shipped.",
    items: [
      "Resume upload — drag a PDF, profile auto-fills.",
      "Paste a website URL — business profile extracts itself.",
    ],
  },
  {
    eyebrow: "Next",
    title: "Where this goes.",
    items: [
      "Hardening the Squarespace + Affinity integrations.",
      "Getting access to the right API keys so users can upload their information.",
    ],
  },
];

export default function ClosingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 pt-16 pb-20">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        {COLUMNS.map((col) => (
          <section key={col.eyebrow}>
            <span className="eyebrow text-orange-500">{col.eyebrow}</span>
            <h2 className="mt-2 font-serif text-xl font-semibold tracking-[-0.01em] text-ink">
              {col.title}
            </h2>
            <ul className="mt-4 space-y-2 text-[13px] leading-relaxed text-warmgray-700">
              {col.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span
                    className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-orange-500"
                    aria-hidden
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-center gap-2 pt-12 text-warmgray-500">
        <DelicateArch className="h-5 w-5" />
        <span className="font-mono text-[11px] uppercase tracking-wider text-orange-500">
          Connections Hub
        </span>
      </div>
    </main>
  );
}
