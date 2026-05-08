"use client";

import { cn } from "@/lib/utils";

/** Compact horizontal row of social-link icon-buttons. Hidden cleanly when empty. */
export function SocialLinks({
  linkedinUrl,
  xUrl,
  websiteUrl,
  email,
  className,
}: {
  linkedinUrl?: string;
  xUrl?: string;
  websiteUrl?: string;
  email?: string;
  className?: string;
}) {
  const items: Array<{ href: string; label: string; icon: React.ReactNode }> = [];
  if (linkedinUrl) items.push({ href: linkedinUrl, label: "LinkedIn", icon: <LinkedInGlyph /> });
  if (xUrl)        items.push({ href: xUrl, label: "X", icon: <XGlyph /> });
  if (websiteUrl)  items.push({ href: websiteUrl, label: "Website", icon: <GlobeGlyph /> });
  if (email)       items.push({ href: `mailto:${email}`, label: "Email", icon: <MailGlyph /> });
  if (items.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {items.map((it) => (
        <a
          key={it.label}
          href={it.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={it.label}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-warmgray-200 text-warmgray-600 transition hover:border-orange-300 hover:bg-sand-50 hover:text-orange-600"
        >
          {it.icon}
        </a>
      ))}
    </div>
  );
}

function LinkedInGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-3.5 w-3.5">
      <path d="M4.98 3.5C4.98 4.88 3.86 6 2.48 6S-0.02 4.88-0.02 3.5 1.1 1 2.48 1s2.5 1.12 2.5 2.5zM.22 8h4.5v14h-4.5V8zm7.5 0h4.31v1.92h.06c.6-1.13 2.07-2.32 4.26-2.32 4.55 0 5.39 3 5.39 6.91V22h-4.5v-6.79c0-1.62-.03-3.7-2.25-3.7-2.26 0-2.6 1.76-2.6 3.58V22h-4.5V8z" />
    </svg>
  );
}

function XGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-3.5 w-3.5">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function GlobeGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-3.5 w-3.5">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
    </svg>
  );
}

function MailGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-3.5 w-3.5">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}
