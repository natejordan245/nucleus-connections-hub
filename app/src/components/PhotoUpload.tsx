"use client";

import { Camera, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Avatar } from "./Avatar";

/**
 * Profile / logo upload. Posts the file to Supabase Storage under
 * `profile-photos/{auth.uid()}/avatar-{ts}.{ext}` and writes the public URL
 * into a hidden form input named `name` so the parent <form> picks it up.
 *
 * Demo / anon mode: no auth user → falls back to a data URL embedded in the
 * hidden input so the form still has *something* to submit.
 */
export function PhotoUpload({
  name,
  defaultUrl,
  label,
  fallbackName,
}: {
  name: string;
  defaultUrl?: string;
  label: string;
  fallbackName: string;
}) {
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUrl(defaultUrl ?? "");
  }, [defaultUrl]);

  async function handleFile(file: File) {
    setBusy(true);
    setErr(null);
    try {
      const sb = getSupabaseBrowserClient();
      const { data: userData } = await sb.auth.getUser();
      const uid = userData?.user?.id;

      if (!uid) {
        // No auth (demo lane). Inline as data URL so the form has a value.
        const reader = new FileReader();
        reader.onloadend = () => {
          setUrl(String(reader.result));
          setBusy(false);
        };
        reader.readAsDataURL(file);
        return;
      }

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${uid}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await sb.storage
        .from("profile-photos")
        .upload(path, file, { cacheControl: "3600", upsert: true });
      if (upErr) throw upErr;
      const { data } = sb.storage.from("profile-photos").getPublicUrl(path);
      setUrl(data.publicUrl);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-start gap-4">
      <input type="hidden" name={name} value={url} />
      <Avatar name={fallbackName} src={url || undefined} size="lg" />
      <div className="flex-1">
        <label
          htmlFor={`${name}-file`}
          className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full bg-ink px-4 text-xs font-semibold text-white transition hover:bg-warmgray-800"
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} aria-hidden />
          ) : (
            <Camera className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          )}
          {url ? "Replace photo" : label}
        </label>
        <input
          ref={inputRef}
          id={`${name}-file`}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
          disabled={busy}
        />
        {err && (
          <p className="mt-2 text-sm text-red-700">{err}</p>
        )}
        {!err && (
          <p className="mt-2 text-xs text-warmgray-500">
            PNG, JPG, or WebP. Stored in your account.
          </p>
        )}
      </div>
    </div>
  );
}
