import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        serif: ["var(--font-instrument-serif)", "ui-serif", "Georgia", "serif"],
      },
      colors: {
        ink: {
          DEFAULT: "oklch(0.96 0.005 80)",
          dim: "oklch(0.82 0.008 80)",
          mute: "oklch(0.62 0.01 80)",
          faint: "oklch(0.46 0.01 80)",
        },
        bg: {
          DEFAULT: "oklch(0.15 0.008 70)",
          soft: "oklch(0.18 0.008 70)",
          card: "oklch(0.205 0.008 70)",
          edge: "oklch(0.24 0.008 70)",
          deep: "oklch(0.12 0.008 70)",
        },
        ai: {
          DEFAULT: "oklch(0.88 0.18 125)",
          dim: "oklch(0.72 0.14 125)",
          deep: "oklch(0.56 0.10 125)",
        },
        good: { DEFAULT: "oklch(0.78 0.10 155)" },
        warn: { DEFAULT: "oklch(0.80 0.14 75)" },
        danger: { DEFAULT: "oklch(0.72 0.16 25)" },
      },
      boxShadow: {
        card: "0 1px 0 oklch(1 0 0 / 0.04) inset, 0 1px 0 oklch(0 0 0 / 0.4)",
        pop: "0 30px 80px -20px oklch(0 0 0 / 0.6), 0 0 0 1px oklch(0.24 0.008 70)",
        glow: "0 0 0 1px oklch(0.88 0.18 125 / 0.35), 0 0 40px -10px oklch(0.88 0.18 125 / 0.5)",
      },
      keyframes: {
        scan: { "0%": { transform: "translateX(-100%)" }, "100%": { transform: "translateX(200%)" } },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
        "ai-pulse": {
          "0%,100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.12)" },
        },
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        "fade-in": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "slide-up": { from: { opacity: "0", transform: "translateY(20px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
      animation: {
        scan: "scan 2.6s linear infinite",
        "spin-slow": "spin-slow 6s linear infinite",
        "ai-pulse": "ai-pulse 2.4s ease-in-out infinite",
        marquee: "marquee 36s linear infinite",
        "marquee-fast": "marquee 22s linear infinite",
        "fade-in": "fade-in 0.4s ease both",
        "slide-up": "slide-up 0.5s ease both",
      },
    },
  },
  plugins: [],
};

export default config;
