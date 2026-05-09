import Link from "next/link";
import { DelicateArch } from "./DelicateArch";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-8 py-6">
        <Link href="/" className="flex items-center gap-3">
          <DelicateArch className="h-7 w-7 text-orange-500" />
          <span className="font-serif text-lg font-semibold text-ink">
            Connections Hub
          </span>
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 items-center px-6 pb-16 pt-4">
        {children}
      </main>
      <footer className="mx-auto flex w-full max-w-6xl items-center justify-between border-t border-warmgray-100 px-8 py-6 text-[10px] uppercase tracking-track text-warmgray-400">
        <span>© 2026 Connections Hub</span>
        <span>Salt Lake City, Utah</span>
      </footer>
    </div>
  );
}

export function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="eyebrow text-warmgray-500">
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "mt-1 w-full rounded-lg border border-warmgray-200 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-300/40 " +
        (props.className ?? "")
      }
    />
  );
}

export function PrimaryButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        "inline-flex h-10 w-full items-center justify-center rounded-full bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60 " +
        (props.className ?? "")
      }
    >
      {children}
    </button>
  );
}
