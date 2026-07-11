import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "var(--primary)", dark: "var(--primary-dark)", light: "var(--primary-light)" },
        accent: { DEFAULT: "var(--accent)", light: "var(--accent-light)" },
        background: "var(--background)",
        card: "var(--card)",
        "txt-primary": "var(--text-primary)",
        "txt-secondary": "var(--text-secondary)",
        warning: "var(--warning)",
        error: "var(--error)",
        border: "var(--border)",
      },
      borderRadius: { card: "12px", btn: "8px", pill: "999px" },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06)",
        hover: "0 4px 12px rgba(0,0,0,0.10)",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      keyframes: {
        shake: { "0%,100%": { transform: "translateX(0)" }, "20%,60%": { transform: "translateX(-8px)" }, "40%,80%": { transform: "translateX(8px)" } },
        flyup: { "0%": { opacity: "1", transform: "translateY(0)" }, "100%": { opacity: "0", transform: "translateY(-40px)" } },
      },
      animation: { shake: "shake 0.4s ease-in-out", flyup: "flyup 1s ease-out forwards" },
    },
  },
  plugins: [],
};
export default config;
