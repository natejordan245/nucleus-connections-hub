import type { Config } from "tailwindcss";

// Theme tuned to nucleusutah.org: clean white surfaces, cool slate neutrals,
// confident royal-blue accent, all-Bricolage typography. Token names are kept
// (`orange-*`, `warmgray-*`, `paper`, `sand-*`) so existing markup picks up
// the new palette without per-file edits — the names are functional, not literal.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        warmgray: {
          50: "#f8fafc",
          100: "#e2e8f0",
          200: "#cbd5e1",
          300: "#94a3b8",
          400: "#64748b",
          500: "#475569",
          600: "#334155",
          700: "#1e293b",
          800: "#0f172a",
          900: "#020617",
        },
        orange: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#2563eb",
          600: "#1d4ed8",
          700: "#1e40af",
          800: "#1e3a8a",
          900: "#172554",
          DEFAULT: "#2563eb",
        },
        sand: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
        },
        paper: "#ffffff",
        ink: "#0f172a",
      },
      fontFamily: {
        sans: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        serif: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      letterSpacing: {
        track: "0.18em",
      },
    },
  },
  plugins: [],
};

export default config;
