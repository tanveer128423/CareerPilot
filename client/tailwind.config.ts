import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 400: "#818CF8", 500: "#6366F1", 600: "#4F46E5" },
        surface: { DEFAULT: "#FAFAFB", 2: "#F4F4F6" },
        ink: { DEFAULT: "#16181D", soft: "#5B6068", muted: "#8A8F98" },
        success: "#16A34A",
        warning: "#D97706",
        danger: "#DC2626",
        info: "#0EA5E9",
      },
      borderRadius: { xl: "12px", "2xl": "16px" },
      boxShadow: {
        card: "0 1px 2px rgba(16,18,29,.04),0 1px 3px rgba(16,18,29,.06)",
        cardHover: "0 4px 12px rgba(16,18,29,.08),0 2px 4px rgba(16,18,29,.04)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg,#6366F1 0%,#8B5CF6 50%,#EC4899 100%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
