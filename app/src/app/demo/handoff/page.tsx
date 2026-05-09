import { ArrowRight } from "lucide-react";

export default function HandoffPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-warmgray-900 px-6 text-paper">
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 80% 30%, rgba(255,255,255,0.6) 0, transparent 35%), radial-gradient(circle at 20% 70%, rgba(37,99,235,0.5) 0, transparent 40%)",
        }}
      />

      <h1
        className="show-fade-up max-w-3xl text-center font-serif text-[64px] leading-[1.04] tracking-[-0.02em]"
        style={{ animationDelay: "100ms" }}
      >
        Now let's use it.
      </h1>

      <form
        action="/api/demo/exit?to=login"
        method="POST"
        className="show-fade-up mt-10"
        style={{ animationDelay: "500ms" }}
      >
        <button
          type="submit"
          className="group inline-flex h-12 items-center gap-2 rounded-full bg-orange-500 px-7 text-sm font-semibold text-white transition hover:bg-orange-600"
        >
          Open the product
          <ArrowRight
            className="h-4 w-4 transition group-hover:translate-x-0.5"
            strokeWidth={2.25}
            aria-hidden
          />
        </button>
      </form>
    </main>
  );
}
