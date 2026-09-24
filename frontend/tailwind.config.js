/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F7F4ED",
        ink: {
          50: "#F0F1F5",
          100: "#DADEE7",
          400: "#5C6785",
          600: "#2F3A5A",
          700: "#1E2740",
          900: "#14192B",
        },
        ledger: {
          green: "#2F6F4E",
          "green-soft": "#E4EEE7",
          rust: "#B4432F",
          "rust-soft": "#F4E5E1",
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

