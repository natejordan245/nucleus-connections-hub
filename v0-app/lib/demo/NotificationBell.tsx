"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { notificationService } from "@/lib/services/factory";
import type { NotificationDTO } from "@/contracts/data";

const POLL_MS = 4000;
const DEFAULT_VIEWER = "tal-sarah-chen";

/**
 * Header bell. Reads the active viewer id from the URL's `?as=` param so it
 * naturally tracks "who am I right now" across slides. Polls the inbox every
 * 4s while mounted; opens a dropdown of recent notifications on click.
 */
export function NotificationBell() {
  const params = useSearchParams();
  const router = useRouter();
  const viewerId = params.get("as") ?? DEFAULT_VIEWER;

  const [items, setItems] = useState<NotificationDTO[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const list = await notificationService.list(viewerId);
        if (!cancelled) setItems(list);
      } catch {
        /* swallow — header bell shouldn't error-spam the console in dev */
      }
    }
    tick();
    const interval = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [viewerId]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  const unread = items.filter((n) => !n.readAt).length;

  async function handleClickItem(n: NotificationDTO) {
    setOpen(false);
    await notificationService.markRead({ recipientId: viewerId, ids: [n.id] });
    setItems((cur) => cur.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
    router.push(n.href);
  }

  async function markAll() {
    if (unread === 0) return;
    await notificationService.markRead({ recipientId: viewerId, all: true });
    const now = new Date().toISOString();
    setItems((cur) => cur.map((x) => (x.readAt ? x : { ...x, readAt: now })));
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        className="relative flex h-7 w-7 items-center justify-center rounded-md border border-warmgray-200 text-warmgray-600 transition hover:border-orange-300 hover:bg-sand-50 hover:text-orange-700"
      >
        <BellGlyph />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-w-[16px] items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-bold text-white shadow-[0_0_0_2px_var(--paper)]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[340px] overflow-hidden rounded-lg border border-warmgray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-warmgray-100 px-3 py-2">
            <span className="eyebrow text-warmgray-500">Notifications</span>
            <button
              onClick={markAll}
              disabled={unread === 0}
              className="text-[11px] font-semibold text-warmgray-500 hover:text-orange-600 disabled:opacity-40"
            >
              Mark all read
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-warmgray-500">
                No notifications yet. When someone expresses interest, you'll see it here.
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClickItem(n)}
                  className={`block w-full border-b border-warmgray-100 px-4 py-3 text-left text-xs transition last:border-b-0 hover:bg-sand-50 ${
                    n.readAt ? "bg-white text-warmgray-600" : "bg-sand-50/40 text-ink"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.readAt && (
                      <span
                        aria-hidden
                        className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium leading-snug">{n.message}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] uppercase tracking-track text-warmgray-400">
                        <span>{n.kind === "mutual_match" ? "Mutual match" : "Interest received"}</span>
                        <span>·</span>
                        <span>{relativeTime(n.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="border-t border-warmgray-100 bg-warmgray-50 px-3 py-2 text-[10px] text-warmgray-500">
            Viewing as <code className="font-mono text-warmgray-700">{viewerId}</code>
          </div>
        </div>
      )}
    </div>
  );
}

function BellGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-4 w-4">
      <path d="M18 16v-5a6 6 0 10-12 0v5l-1.5 2h15L18 16z" />
      <path d="M10 21a2 2 0 004 0" />
    </svg>
  );
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const sec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}
