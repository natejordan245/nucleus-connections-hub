type Tone = "neutral" | "orange" | "emerald" | "warmgray";

const TONE_CLASS: Record<Tone, string> = {
  neutral:  "border-warmgray-200 bg-white text-warmgray-700",
  warmgray: "border-warmgray-100 bg-warmgray-50 text-warmgray-700",
  orange:   "border-orange-200 bg-orange-50 text-orange-700",
  emerald:  "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium " +
        TONE_CLASS[tone]
      }
    >
      {children}
    </span>
  );
}
