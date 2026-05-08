"use client";

import { cn } from "@/lib/utils";

/** Deterministic fallback avatar service for when a profile has no `photoUrl`. */
function fallbackAvatar(seed: string, size = 240): string {
  return `https://i.pravatar.cc/${size}?u=${encodeURIComponent(seed)}`;
}

export function TalentAvatar({
  id,
  name,
  photoUrl,
  size = 56,
  className,
}: {
  id: string;
  name: string;
  photoUrl?: string;
  size?: number;
  className?: string;
}) {
  const src = photoUrl || fallbackAvatar(id, size * 2);
  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      className={cn(
        "shrink-0 rounded-full object-cover ring-1 ring-warmgray-200",
        className
      )}
      style={{ width: size, height: size }}
      loading="lazy"
    />
  );
}

/**
 * Square letter-mark for startups. We don't generate logos for synthetic
 * companies, but a quiet two-letter mark on a sand background reads as a
 * deliberate placeholder rather than a missing image.
 */
export function StartupLogo({
  name,
  logoUrl,
  size = 56,
  className,
}: {
  name: string;
  logoUrl?: string;
  size?: number;
  className?: string;
}) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        width={size}
        height={size}
        className={cn(
          "shrink-0 rounded-md object-cover ring-1 ring-warmgray-200",
          className
        )}
        style={{ width: size, height: size }}
        loading="lazy"
      />
    );
  }
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md bg-sand-100 font-serif font-semibold text-orange-700 ring-1 ring-orange-100",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
