"use client";

import type { TalentDTO, StartupDTO } from "@/contracts/data";
import { TalentAvatar, StartupLogo } from "./Avatar";
import { SocialLinks } from "./SocialLinks";

function isTalent(p: TalentDTO | StartupDTO): p is TalentDTO {
  return "availability" in p;
}

export function ProfileSummary({ profile }: { profile: TalentDTO | StartupDTO }) {
  const isT = isTalent(profile);
  const headline = isT ? profile.headline : profile.oneLiner;
  const tags = isT
    ? [
        profile.availability,
        ...profile.compensation,
        ...profile.stagePrefs,
        ...profile.domains,
      ]
    : [
        profile.sector,
        profile.origin,
        profile.fundingStage,
        profile.fundingStatus,
        ...profile.needs.map((n) => `needs: ${n}`),
      ];

  return (
    <section className="rounded-xl border border-warmgray-100 bg-white p-7 shadow-sm">
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-5">
          {isT ? (
            <TalentAvatar
              id={profile.id}
              name={profile.name}
              photoUrl={profile.photoUrl}
              size={72}
            />
          ) : (
            <StartupLogo
              name={profile.name}
              logoUrl={profile.logoUrl}
              size={72}
            />
          )}
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink">
              {profile.name}
            </h1>
            <p className="mt-1 max-w-xl text-sm text-warmgray-600">{headline}</p>
            <div className="mt-3">
              <SocialLinks
                linkedinUrl={profile.linkedinUrl}
                xUrl={profile.xUrl}
                websiteUrl={isT ? undefined : profile.websiteUrl}
                email={isT ? profile.email : undefined}
              />
            </div>
          </div>
        </div>
        <div className="shrink-0 text-right text-xs text-warmgray-500">
          <div>{profile.location}</div>
          <div className="mt-0.5 font-mono text-[10px] text-warmgray-400">{profile.id}</div>
        </div>
      </div>

      <p className="mt-6 leading-relaxed text-warmgray-700">
        {isT ? profile.bio : profile.description}
      </p>

      {isT && profile.lookingFor && (
        <div className="mt-5 rounded-lg border border-orange-200 bg-sand-50 p-4">
          <div className="eyebrow mb-1.5 text-orange-700">What {profile.name.split(" ")[0]} is looking for</div>
          <p className="text-[15px] leading-relaxed text-ink">{profile.lookingFor}</p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-1.5">
        {tags.map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="rounded border border-warmgray-100 bg-warmgray-50 px-2 py-0.5 text-[11px] text-warmgray-700"
          >
            {t}
          </span>
        ))}
      </div>

      {isT && profile.skills.length > 0 && (
        <div className="mt-5">
          <div className="eyebrow mb-1.5 text-warmgray-500">Skills</div>
          <div className="flex flex-wrap gap-1.5">
            {profile.skills.map((s) => (
              <span
                key={s}
                className="rounded-full border border-orange-200 bg-sand-50 px-2.5 py-0.5 text-[11px] text-orange-700"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {profile.utahOrgs.length > 0 && (
        <div className="mt-5">
          <div className="eyebrow mb-1.5 text-orange-600">Utah affiliations</div>
          <div className="flex flex-wrap gap-1.5">
            {profile.utahOrgs.map((o) => (
              <span
                key={o.id}
                className="rounded-full border border-orange-200 bg-sand-50 px-2.5 py-0.5 text-[11px] text-orange-700"
              >
                {o.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
