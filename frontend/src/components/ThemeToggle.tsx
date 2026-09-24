import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <button
      type="button"
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      aria-label="Toggle dark mode"
      className="flex items-center gap-1.5 rounded-lg border border-ink-100 px-2 py-1.5 text-sm text-ink-700 hover:bg-ink-50"
    >
      {theme === "dark" ? (
        <>
          <span aria-hidden="true">☀️</span> Light
        </>
      ) : (
        <>
          <span aria-hidden="true">🌙</span> Dark
        </>
      )}
    </button>
  );
}
