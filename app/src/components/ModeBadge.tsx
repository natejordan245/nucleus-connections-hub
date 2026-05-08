import { APP_MODE } from "@/lib/mode";

export function ModeBadge() {
  const isDemo = APP_MODE === "demo";
  return (
    <span
      className={
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-track " +
        (isDemo
          ? "border-orange-200 bg-orange-50 text-orange-700"
          : "border-warmgray-200 bg-white text-warmgray-700")
      }
    >
      <span
        className={
          "h-1.5 w-1.5 rounded-full " +
          (isDemo ? "bg-orange-500" : "bg-emerald-500")
        }
      />
      {isDemo ? "Demo mode" : "Live"}
    </span>
  );
}
