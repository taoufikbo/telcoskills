"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
export const CLE_THEME = "tcr:theme";

/** Script exécuté avant le premier rendu pour éviter un flash de thème. */
export const SCRIPT_THEME = `try{var t=localStorage.getItem("${CLE_THEME}");var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark");document.documentElement.dataset.theme=d?"dark":"light"}catch(e){}`;

function abonner(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
}

export function useTheme(): [Theme, (t: Theme) => void] {
  const theme = useSyncExternalStore<Theme>(
    abonner,
    () => (document.documentElement.classList.contains("dark") ? "dark" : "light"),
    () => "light",
  );
  const definir = useCallback((t: Theme) => {
    document.documentElement.classList.toggle("dark", t === "dark");
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem(CLE_THEME, t);
    } catch {
      // stockage indisponible : le choix vaut pour la session seulement
    }
  }, []);
  return [theme, definir];
}
