"use client";

import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { NotificationDTO } from "@/lib/data/types";

export function NotificationBell({ viewerId }: { viewerId: string }) {
  const [items, setItems] = useState<NotificationDTO[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const r = await fetch(`/api/notifications?recipientId=${encodeURIComponent(viewerId)}`);
        const j = (await r.json()) as { notifications?: NotificationDTO[] };
        if (alive) setItems(j.notifications ?? []);
      } catch {
        // demo mode + flaky network — silent failure is fine for the bell
      }
    }
    load();
    const t = setInterval(load, 8000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [viewerId]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const unread = items.filter((n) => n.readAt === null).length;

  async function markRead() {
    try {
      await fetch(
        `/api/notifications?action=mark-read&recipientId=${encodeURIComponent(viewerId)}`,
        { method: "POST" },
      );
      setItems((prev) => prev.map((n) => (n.readAt === null ? { ...n, readAt: new Date().toISOString() } : n)));
    } catch {
      // ignore
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-warmgray-700 transition hover:bg-warmgray-50 hover:text-ink"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
        {unread > 0 && (
          <span className="absolute right-1 top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-semibold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-20 w-80 overflow-hidden rounded-2xl border border-warmgray-100 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-warmgray-100 px-4 py-3">
            <span className="eyebrow text-warmgray-500">Notifications</span>
            {unread > 0 && (
              <button
                onClick={markRead}
                className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700"
              >
                <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                Mark all read
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-warmgray-500">
              No notifications yet.
            </p>
          ) : (
            <ul className="max-h-[60vh] divide-y divide-warmgray-100 overflow-y-auto">
              {items.slice(0, 12).map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 transition hover:bg-paper"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-ink">{n.title}</span>
                      {n.readAt === null && (
                        <span className="ml-2 h-1.5 w-1.5 rounded-full bg-orange-500" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-warmgray-600">
                      {n.body}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
