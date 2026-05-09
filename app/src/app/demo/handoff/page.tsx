import { ArrowRight } from "lucide-react";
import { DelicateArch } from "@/components/DelicateArch";

export default function HandoffPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-warmgray-900 px-6 text-paper">
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 30%, rgba(255,255,255,0.6) 0, transparent 35%), radial-gradient(circle at 20% 70%, rgba(37,99,235,0.5) 0, transparent 40%)",
          }}
        />
      </div>

      <span
        className="show-fade-up eyebrow text-orange-400"
        style={{ animationDelay: "100ms" }}
      >
        End of slides · the real product is next
      </span>
      <h1
        className="show-fade-up mt-4 max-w-3xl text-center font-serif text-[56px] leading-[1.04] tracking-[-0.02em] sm:text-[64px]"
        style={{ animationDelay: "300ms" }}
      >
        Slides are easy.
        <br />
        Software is real.
      </h1>
      <p
        className="show-fade-up mt-6 max-w-xl text-center text-base text-warmgray-300"
        style={{ animationDelay: "600ms" }}
      >
        Let's open the product as Sarah Chen and run her search live. From here
        on, every match, every reason, every bell ping is the actual app.
      </p>

      <form
        action="/api/demo/start"
        method="POST"
        className="show-fade-up mt-10"
        style={{ animationDelay: "900ms" }}
      >
        <button
          type="submit"
          className="group inline-flex h-12 items-center gap-2 rounded-full bg-orange-500 px-7 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.7)] transition hover:bg-orange-600 hover:shadow-[0_10px_30px_-8px_rgba(37,99,235,0.85)]"
        >
          Open the product
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" strokeWidth={2.25} aria-hidden />
        </button>
      </form>

      <div
        className="show-fade-in absolute bottom-8 left-0 right-0 flex flex-col items-center gap-2 text-[11px] text-warmgray-500"
        style={{ animationDelay: "1400ms" }}
      >
        <div className="flex items-center gap-2">
          <DelicateArch className="h-5 w-5" />
          <span className="font-mono uppercase tracking-wider text-orange-400">Connections Hub</span>
        </div>
        <span className="font-mono uppercase tracking-wider">
          live demo · running on the actual production build
        </span>
      </div>
    </main>
  );
}
