import Link from "next/link";

export type Crumb = {
  /** Display text. Parent crumbs render uppercase + mono; the leaf renders mixed-case ink. */
  label: string;
  /** When omitted, the crumb renders as the current page (last item). */
  href?: string;
};

/**
 * Dense breadcrumb trail used at the top of detail pages (profile, handshake).
 * Replaces the older "← Back to dashboard" link — the parent crumbs are
 * clickable and the leaf is the page title context, so the user sees the
 * full path instead of a single hop back.
 *
 * Visual language:
 *   - parent crumbs:  mono [10px] uppercase tracked, warmgray-500 → ink on hover
 *   - separator:      `›` in warmgray-300
 *   - leaf:           mixed-case warmgray-700, semibold
 */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((c, i) => {
          const isLeaf = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
              {isLeaf ? (
                <span className="text-xs font-semibold text-warmgray-700">
                  {c.label}
                </span>
              ) : (
                <CrumbLink label={c.label} href={c.href} />
              )}
              {!isLeaf && (
                <span aria-hidden className="font-mono text-xs text-warmgray-300">
                  ›
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function CrumbLink({ label, href }: { label: string; href?: string }) {
  const className =
    "font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-warmgray-500 transition hover:text-ink";
  if (!href) {
    return <span className={className}>{label}</span>;
  }
  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}
