/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0A0E13",
          surface: "#12171F",
          elevated: "#1A2029",
          border: "#242C38",
        },
        brand: {
          DEFAULT: "#27D9A3",
          soft: "#6BE8C4",
          dim: "#16805F",
        },
        gain: "#27D9A3",
        loss: "#F0596B",
        ink50: "#EDF1F5",
        ink70: "#8B96A5",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      keyframes: {
        "aurora-drift": {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(4%, -5%, 0) scale(1.15)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "aurora-drift": "aurora-drift 14s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        "fade-up": "fade-up 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};