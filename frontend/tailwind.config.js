/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "rgb(var(--color-paper) / <alpha-value>)",
        white: "rgb(var(--color-surface) / <alpha-value>)",
        ink: {
          50: "rgb(var(--color-ink-50) / <alpha-value>)",
          100: "rgb(var(--color-ink-100) / <alpha-value>)",
          400: "rgb(var(--color-ink-400) / <alpha-value>)",
          600: "rgb(var(--color-ink-600) / <alpha-value>)",
          700: "rgb(var(--color-ink-700) / <alpha-value>)",
          900: "rgb(var(--color-ink-900) / <alpha-value>)",
        },
        ledger: {
          green: "rgb(var(--color-ledger-green) / <alpha-value>)",
          "green-soft": "rgb(var(--color-ledger-green-soft) / <alpha-value>)",
          rust: "rgb(var(--color-ledger-rust) / <alpha-value>)",
          "rust-soft": "rgb(var(--color-ledger-rust-soft) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};