import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      spacing: { "4.5": "1.125rem", "5.5": "1.375rem" },
      colors: {
        brand: {
          50: "#F6F2FF",
          100: "#EBE2FF",
          200: "#D6C4FF",
          300: "#B898F5",
          400: "#8F5CEA",
          500: "#6F2FDB",
          600: "#5415C6",
          700: "#420FA0",
          800: "#2F0B72",
          900: "#1E0850",
        },
        leaf: { 50: "#E8FBF2", 100: "#C8F5DF", 400: "#35DB94", 500: "#08C978", 600: "#06A663", 700: "#058650" },
        ink: { DEFAULT: "#140B3A", soft: "#4B4570", mute: "#7C7799" },
        lav: "#F5F1FF",
      },
      fontFamily: { sans: ["var(--font-jakarta)", "ui-sans-serif", "system-ui", "sans-serif"] },
      boxShadow: {
        card: "0 1px 2px rgba(20,11,58,0.04), 0 8px 24px -12px rgba(84,21,198,0.18)",
        pop: "0 12px 40px -12px rgba(20,11,58,0.35)",
      },
      keyframes: {
        pop: { "0%": { transform: "scale(.96)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
        up: { "0%": { transform: "translateY(8px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
      },
      animation: { pop: "pop .16s ease-out", up: "up .2s ease-out" },
    },
  },
  plugins: [],
};
export default config;
