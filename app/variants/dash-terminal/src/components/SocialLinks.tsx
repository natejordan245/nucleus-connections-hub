type Profile = {
  linkedinUrl?: string;
  xUrl?: string;
  websiteUrl?: string;
};

export function SocialLinks({ profile }: { profile: Profile }) {
  const items: { label: string; href: string }[] = [];
  if (profile.linkedinUrl) items.push({ label: "LinkedIn", href: profile.linkedinUrl });
  if (profile.websiteUrl) items.push({ label: "Site", href: profile.websiteUrl });
  if (profile.xUrl) items.push({ label: "X", href: profile.xUrl });

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {items.map((it) => (
        <a
          key={it.label}
          href={it.href}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-warmgray-200 bg-white px-3 py-1 text-warmgray-700 transition hover:border-orange-300 hover:text-orange-700"
        >
          {it.label} →
        </a>
      ))}
    </div>
  );
}
