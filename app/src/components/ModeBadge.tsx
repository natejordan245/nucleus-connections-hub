import { toggleAppMode } from "@/app/actions/toggle-mode";
import { getAppMode } from "@/lib/mode";

/**
 * Header pill that surfaces the current app mode and toggles it on click.
 * Server-action based so the swap is one round-trip and survives reload.
 */
export function ModeBadge() {
  const mode = getAppMode();
  const isDemo = mode === "demo";

  return (
    <form action={toggleAppMode}>
      <button
        type="submit"
        title={`Switch to ${isDemo ? "Live" : "Demo"} mode`}
        aria-label={`Mode: ${isDemo ? "Demo" : "Live"}. Click to switch.`}
        className={
          "group inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-track transition " +
          (isDemo
            ? "border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-300 hover:bg-orange-100"
            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100")
        }
      >
        <span
          aria-hidden
          className={
            "h-1.5 w-1.5 rounded-full " + (isDemo ? "bg-orange-500" : "bg-emerald-500")
          }
        />
        {isDemo ? "Demo" : "Live"}
        <span aria-hidden className="opacity-0 transition group-hover:opacity-100">⇆</span>
      </button>
    </form>
  );
}
