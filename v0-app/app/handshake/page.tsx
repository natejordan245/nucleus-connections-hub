"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { interestService, profileService } from "@/lib/services/factory";
import type { InterestState, TalentDTO, StartupDTO } from "@/contracts/data";

function HandshakeInner() {
  const params = useSearchParams();
  const asId = params.get("as") ?? "tal-sarah-chen";
  const withId = params.get("with") ?? "sup-bramble-ai";
  const isTalent = asId.startsWith("tal-");
  const talentId = isTalent ? asId : withId;
  const startupId = isTalent ? withId : asId;

  const [talent, setTalent] = useState<TalentDTO | null>(null);
  const [startup, setStartup] = useState<StartupDTO | null>(null);
  const [state, setState] = useState<InterestState | null>(null);
  const [pending, setPending] = useState<"talent" | "startup" | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [t, s, i] = await Promise.all([
        profileService.getTalent(talentId),
        profileService.getStartup(startupId),
        interestService.getInterest({ talentId, startupId }),
      ]);
      if (cancelled) return;
      setTalent(t);
      setStartup(s);
      setState(i);
    })();
    return () => {
      cancelled = true;
    };
  }, [talentId, startupId]);

  async function vote(from: "talent" | "startup") {
    setPending(from);
    try {
      const next = await interestService.expressInterest({
        talentId,
        startupId,
        from,
        state: "interested",
      });
      setState(next);
    } finally {
      setPending(null);
    }
  }

  if (!talent || !startup || !state) {
    return <div className="text-sm text-warmgray-500">Loading handshake…</div>;
  }

  const mutual = !!state.mutualAt;

  return (
    <div className="grid gap-6 py-2">
      <header>
        <h1 className="text-2xl font-semibold text-ink">Mutual-interest handshake</h1>
        <p className="mt-1 text-sm text-warmgray-500">
          A connection only fires when both sides flip to <em>interested</em>. We never share
          contact info before that.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Side
          label="Talent"
          name={talent.name}
          sub={talent.headline}
          state={state.talentState}
          pending={pending === "talent"}
          onClick={() => vote("talent")}
        />
        <Side
          label="Startup"
          name={startup.name}
          sub={startup.oneLiner}
          state={state.startupState}
          pending={pending === "startup"}
          onClick={() => vote("startup")}
        />
      </div>

      <div
        className={`rounded-lg border p-6 text-center transition ${
          mutual
            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
            : "border-warmgray-100 bg-white text-warmgray-500"
        }`}
      >
        {mutual ? (
          <>
            <div className="text-2xl">🤝</div>
            <h3 className="mt-2 text-lg font-semibold">Mutual interest at {state.mutualAt}</h3>
            <p className="mt-1 text-sm">
              Pushed to Affinity (mock-mode logged the request payload).
            </p>
            <Link
              href="/affinity-push"
              className="mt-3 inline-flex rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              View Affinity payload →
            </Link>
          </>
        ) : (
          <p>Both sides need to flip to "interested" before we share contact info.</p>
        )}
      </div>
    </div>
  );
}

function Side({
  label,
  name,
  sub,
  state,
  pending,
  onClick,
}: {
  label: string;
  name: string;
  sub: string;
  state: "pending" | "interested" | "pass";
  pending: boolean;
  onClick: () => void;
}) {
  const flipped = state === "interested";
  return (
    <div
      className={`rounded-lg border p-5 shadow-sm transition ${
        flipped ? "border-emerald-300 bg-emerald-50" : "border-warmgray-100 bg-white"
      }`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-warmgray-500">
        {label}
      </div>
      <h3 className="mt-1 text-lg font-semibold text-ink">{name}</h3>
      <p className="mt-0.5 text-sm text-warmgray-500">{sub}</p>

      <button
        disabled={flipped || pending}
        onClick={onClick}
        className={`mt-4 w-full rounded-md px-3 py-2 text-sm font-semibold shadow transition ${
          flipped
            ? "cursor-default bg-emerald-600 text-white"
            : "bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
        }`}
      >
        {flipped ? "Interested ✓" : pending ? "Saving…" : "Mark interested"}
      </button>
    </div>
  );
}

export default function HandshakePage() {
  return (
    <Suspense fallback={<div className="text-sm text-warmgray-500">Loading…</div>}>
      <HandshakeInner />
    </Suspense>
  );
}
