import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#F6F1E8",
          50: "#FBF8F3",
          100: "#F6F1E8",
          200: "#EDE4D4",
        },
        ink: {
          DEFAULT: "#1C1917",
          muted: "#57534E",
          faint: "#A8A29E",
        },
        navy: {
          DEFAULT: "#1B2A4A",
          700: "#24365E",
          800: "#152238",
          900: "#0F1A2C",
        },
        moss: {
          DEFAULT: "#2F5D45",
          600: "#3A7356",
          700: "#244A37",
        },
        gold: {
          DEFAULT: "#C4A35A",
          600: "#B08D3E",
        },
        clay: {
          DEFAULT: "#B85C38",
          600: "#9A4A2C",
        },
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-public-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(28, 25, 23, 0.06), 0 12px 32px rgba(27, 42, 74, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
