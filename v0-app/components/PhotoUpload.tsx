"use client";

import { useRef } from "react";
import { TalentAvatar } from "./Avatar";

/**
 * File-picker that reads the chosen image as a data URL and hands it back
 * via `onChange`. Works in mock-mode without any upload infrastructure —
 * the data URL lives directly in the in-memory profile DTO.
 */
export function PhotoUpload({
  id,
  name,
  photoUrl,
  onChange,
}: {
  id: string;
  name: string;
  photoUrl?: string;
  onChange: (dataUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") onChange(result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative shrink-0"
        aria-label="Upload profile photo"
      >
        <TalentAvatar id={id} name={name || "?"} photoUrl={photoUrl} size={72} />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-warmgray-900/0 text-[10px] font-semibold uppercase tracking-track text-white opacity-0 transition group-hover:bg-warmgray-900/55 group-hover:opacity-100">
          Change
        </span>
      </button>
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-md border border-warmgray-200 px-3 py-1.5 text-xs font-medium text-warmgray-700 transition hover:border-orange-300 hover:bg-sand-50"
        >
          Upload photo
        </button>
        <p className="mt-1 text-[10px] text-warmgray-500">PNG or JPG. Stored locally for the demo.</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.currentTarget.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </div>
  );
}
