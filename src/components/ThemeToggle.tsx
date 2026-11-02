"use client";

import { useTheme } from "@/lib/useTheme";

export default function ThemeToggle() {
  const [theme, definir] = useTheme();
  const sombre = theme === "dark";
  return (
    <button
      type="button"
      onClick={() => definir(sombre ? "light" : "dark")}
      aria-label={sombre ? "Passer au thème clair" : "Passer au thème sombre"}
      title={sombre ? "Thème clair" : "Thème sombre"}
      className="border-2 border-white px-2.5 py-1.5 text-sm text-white hover:border-orange hover:text-orange"
    >
      <span aria-hidden>{sombre ? "☀" : "☾"}</span>
    </button>
  );
}
