"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { profileService } from "@/lib/services/factory";
import type { StartupDTO } from "@/contracts/data";
import { ProfileSummary } from "@/components/ProfileSummary";

export default function StartupProfilePage({ params }: { params: { id: string } }) {
  const [s, setS] = useState<StartupDTO | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    profileService
      .getStartup(params.id)
      .then((res) => !cancelled && setS(res))
      .catch((e) => !cancelled && setErr(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (err) return <div className="rounded bg-red-50 p-4 text-sm text-red-700">{err}</div>;
  if (!s) return <div className="text-sm text-warmgray-500">Loading…</div>;

  return (
    <div className="grid gap-4">
      <ProfileSummary profile={s} />
      <div className="flex justify-end">
        <Link
          href={`/matches?as=tal-sarah-chen`}
          className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-orange-600"
        >
          See talent matches for Sarah →
        </Link>
      </div>
    </div>
  );
}
