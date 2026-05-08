import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        warmgray: {
          50: "#f1f1f1",
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
        orange: {
          50: "#fff4ef",
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
        sand: {
          50: "#fff8f2",
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
