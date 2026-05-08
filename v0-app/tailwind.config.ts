import type { Config } from "tailwindcss";

// Color tokens sourced from the Utah Design System (utahdts/utah-design-system,
// `_color-swatches.scss`). Re-keyed to the canonical Tailwind 50→900 ramp so
// utility class names are unambiguous (`bg-orange-500` etc).

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm neutral ramp — page surfaces, text, borders.
        warmgray: {
          50:  "#f1f1f1",
          100: "#e4e4e3",
          200: "#d7d7d6",
          300: "#c9c9c8",
          400: "#a2a2a0",
          500: "#7a7a77",
          600: "#52524e",
          700: "#373734",
          800: "#1d1d1c",
          900: "#101010",
        },
        // Brand orange — `electric-orange` ramp from the USDS swatch set.
        // 500 is the brand. 400 is the warmer "light-orange" hover state.
        orange: {
          50:  "#fff4ef",
          100: "#ffeae0",
          200: "#ffd6c1",
          300: "#ffb893",
          400: "#ff9055",
          500: "#ff7227",
          600: "#d26328",
          700: "#a6552a",
          800: "#7a472b",
          900: "#4f392d",
          DEFAULT: "#ff7227",
        },
        // Sandstone — soft warm wash for pills, hover states, eyebrow tints
        sand: {
          50:  "#fff8f2",
          100: "#fff1e6",
          200: "#ffe3ce",
          300: "#ffd5b6",
          400: "#ff9d55",
        },
        paper: "#fbfaf7",
        ink: "#1f1f1f",
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "sans-serif"],
        serif: ['"Source Serif 4"', '"Source Serif Pro"', "Georgia", "serif"],
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
