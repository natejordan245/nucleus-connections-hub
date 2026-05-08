"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BookOpen,
  Home,
  LayoutGrid,
  type LucideIcon,
  Search,
  Settings,
  Shield,
} from "lucide-react";
import { DelicateArch } from "./DelicateArch";
import { Avatar } from "./Avatar";

type Item = { href: string; label: string; icon: LucideIcon };

const NAV: Item[] = [
  { href: "/dashboard",     label: "Home",       icon: Home       },
  { href: "/matches",       label: "Matches",    icon: LayoutGrid },
  { href: "/search",        label: "Search",     icon: Search     },
  { href: "/resources",     label: "Resources",  icon: BookOpen   },
  { href: "/affinity-push", label: "Activity",   icon: Activity   },
];

export type SidebarViewer = {
  id: string;
  name: string;
  photoUrl?: string;
  profileHref: string | null;
  isAdmin?: boolean;
};

export function AppSidebar({ viewer }: { viewer: SidebarViewer | null }) {
  const pathname = usePathname() ?? "";

  return (
    <aside
      className="group sticky top-0 z-30 flex h-screen w-16 flex-col border-r border-warmgray-100 bg-white transition-[width] duration-200 ease-out hover:w-60"
    >
      <Link
        href={viewer ? "/dashboard" : "/"}
        className="flex h-16 items-center gap-3 overflow-hidden px-4"
      >
        <DelicateArch className="h-7 w-7 shrink-0 text-orange-500" />
        <span className="whitespace-nowrap font-serif text-base font-semibold text-ink opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          Nucleus
        </span>
      </Link>

      <nav className="flex-1 px-2 pt-4">
        <ul className="space-y-1">
          {NAV.map((it) => {
            const active = pathname === it.href || pathname.startsWith(it.href + "/");
            return (
              <li key={it.href}>
                <SidebarItem item={it} active={active} />
              </li>
            );
          })}
          {viewer?.isAdmin && (
            <li className="mt-3 border-t border-warmgray-100 pt-3">
              <SidebarItem
                item={{ href: "/admin", label: "Admin", icon: Shield }}
                active={pathname.startsWith("/admin")}
              />
            </li>
          )}
        </ul>
      </nav>

      <div className="border-t border-warmgray-100 p-2">
        <ul className="space-y-1">
          <li>
            <SidebarItem
              item={{ href: "/settings", label: "Settings", icon: Settings }}
              active={pathname.startsWith("/settings")}
            />
          </li>
          <li>
            {viewer ? (
              <Link
                href={viewer.profileHref ?? "/profile"}
                className={cls(
                  "flex h-12 items-center gap-3 overflow-hidden rounded-xl px-2 transition",
                  pathname.startsWith("/profile") && "bg-orange-50",
                )}
              >
                <Avatar name={viewer.name} src={viewer.photoUrl} size="sm" />
                <span className="min-w-0 whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {viewer.name}
                  </span>
                  <span className="block truncate text-[10px] uppercase tracking-track text-warmgray-400">
                    Profile
                  </span>
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex h-12 items-center gap-3 overflow-hidden rounded-xl px-3 text-sm font-medium text-warmgray-700 transition hover:bg-warmgray-50 hover:text-ink"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-warmgray-100 text-warmgray-500">
                  →
                </span>
                <span className="whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  Sign in
                </span>
              </Link>
            )}
          </li>
        </ul>
      </div>
    </aside>
  );
}

function SidebarItem({ item, active }: { item: Item; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cls(
        "flex h-10 items-center gap-3 overflow-hidden rounded-xl px-3 text-sm font-medium transition",
        active
          ? "bg-orange-50 text-orange-700"
          : "text-warmgray-600 hover:bg-warmgray-50 hover:text-ink",
      )}
    >
      <Icon
        className="h-[18px] w-[18px] shrink-0"
        strokeWidth={1.75}
        aria-hidden
      />
      <span className="whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        {item.label}
      </span>
    </Link>
  );
}

function cls(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}
