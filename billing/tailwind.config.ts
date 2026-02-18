import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Aligned with school-tech: same stack as index.css body
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
      },
      colors: {
        // Aligned with school-tech: indigo (slate + indigo theme)
        primary: {
          DEFAULT: "#4f46e5",
          hover: "#4338ca",
          text: "#ffffff",
        },
        danger: {
          DEFAULT: "#dc2626",
          hover: "#b91c1c",
        },
        success: {
          DEFAULT: "#16a34a",
        },
        warning: {
          bg: "#fef3c7",
          text: "#92400e",
        },
        sidebar: {
          DEFAULT: "#1e3a5f",
          active: "#2d4a6f",
          text: "#e2e8f0",
        },
        page: {
          DEFAULT: "#f1f5f9",
          card: "#ffffff",
        },
        border: {
          DEFAULT: "#cbd5e1",
          strong: "#94a3b8",
        },
        input: {
          bg: "#ffffff",
          border: "#cbd5e1",
        },
        table: {
          header: "#e2e8f0",
          alt: "#f1f5f9",
        },
      },
      animation: {
        fadeIn: "fadeIn 0.2s ease-in-out",
        slideIn: "slideIn 0.3s ease-out",
        slideUp: "slideUp 0.2s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        spin: "spin 1s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
