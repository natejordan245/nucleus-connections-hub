"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { profileService } from "@/lib/services/factory";
import type { TalentDTO } from "@/contracts/data";
import { ProfileSummary } from "@/components/ProfileSummary";

export default function TalentProfilePage({ params }: { params: { id: string } }) {
  const [t, setT] = useState<TalentDTO | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    profileService
      .getTalent(params.id)
      .then((res) => !cancelled && setT(res))
      .catch((e) => !cancelled && setErr(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (err) return <div className="rounded bg-red-50 p-4 text-sm text-red-700">{err}</div>;
  if (!t) return <div className="text-sm text-warmgray-500">Loading…</div>;

  return (
    <div className="grid gap-4">
      <ProfileSummary profile={t} />
      <div className="flex justify-end">
        <Link
          href={`/matches?as=${t.id}`}
          className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-orange-600"
        >
          See {t.name.split(" ")[0]}'s matches →
        </Link>
      </div>
    </div>
  );
}
