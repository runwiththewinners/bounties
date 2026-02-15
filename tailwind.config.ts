import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: { DEFAULT: "#d4a843", hi: "#f0c95c", lo: "#a07c2e" },
        fire: "#e8522a",
        surface: { DEFAULT: "#111113", card: "rgba(255,255,255,0.04)" },
        txt: { DEFAULT: "#f5f1eb", muted: "rgba(245,241,235,0.55)", dim: "rgba(245,241,235,0.3)" },
      },
      fontFamily: {
        display: ["Bebas Neue", "sans-serif"],
        heading: ["Oswald", "sans-serif"],
        body: ["DM Sans", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
