import { Check, X } from "lucide-react";
import { requestIntro } from "@/app/(app)/(needs-profile)/profile/actions";

type Side = "candidate" | "business";

/**
 * Two-button action row used in profile-page headers.
 *
 * Always renders both "Request intro" and "Not a fit". Each disables (and
 * shows a checkmark) when its state already matches the persisted side-state,
 * so a viewer can flip from interested → pass or vice versa without a custom
 * undo flow.
 */
export function InterestActions({
  candidateId,
  businessId,
  side,
  alreadyInterested,
  alreadyPassed,
}: {
  candidateId: string;
  businessId: string;
  side: Side;
  alreadyInterested: boolean;
  alreadyPassed: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <form action={requestIntro}>
        <input type="hidden" name="candidateId" value={candidateId} />
        <input type="hidden" name="businessId" value={businessId} />
        <input type="hidden" name="side" value={side} />
        <input type="hidden" name="state" value="pass" />
        <button
          type="submit"
          disabled={alreadyPassed}
          className="inline-flex h-7 items-center gap-1.5 rounded-md border border-warmgray-200 px-2.5 text-[11px] font-semibold text-warmgray-700 transition hover:border-warmgray-300 hover:text-ink disabled:cursor-default disabled:opacity-80 disabled:hover:border-warmgray-200 disabled:hover:text-warmgray-700"
        >
          {alreadyPassed ? (
            <>
              <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Not a fit
            </>
          ) : (
            <>
              <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Not a fit
            </>
          )}
        </button>
      </form>
      <form action={requestIntro}>
        <input type="hidden" name="candidateId" value={candidateId} />
        <input type="hidden" name="businessId" value={businessId} />
        <input type="hidden" name="side" value={side} />
        <input type="hidden" name="state" value="interested" />
        <button
          type="submit"
          disabled={alreadyInterested}
          className="group inline-flex h-7 items-center gap-1.5 rounded-md bg-ink px-2.5 text-[11px] font-semibold text-white transition hover:bg-warmgray-800 disabled:cursor-default disabled:opacity-80 disabled:hover:bg-ink"
        >
          {alreadyInterested ? (
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
    </div>
  );
}
