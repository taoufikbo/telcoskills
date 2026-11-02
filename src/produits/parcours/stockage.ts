"use client";

import { useMemo, useSyncExternalStore } from "react";

const CLE = "tcr:orientation";
const EVENEMENT = "tcr:orientation-maj";

/** Réponses au diagnostic, telles qu'enregistrées : leur validité vis-à-vis de la configuration se vérifie à l'usage. */
export type ReponsesEnregistrees = { metier: string; telecom: string; objectif: string };

const lire = () => {
  try {
    return localStorage.getItem(CLE);
  } catch {
    return null;
  }
};
const abonner = (cb: () => void) => {
  window.addEventListener(EVENEMENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENEMENT, cb);
    window.removeEventListener("storage", cb);
  };
};

/** Lecture tolérante : tout ce qui n'a pas la forme de trois réponses textuelles est ignoré. */
export function lireReponses(brut: string | null): ReponsesEnregistrees | null {
  try {
    const r = JSON.parse(brut ?? "null") as Partial<ReponsesEnregistrees> | null;
    return r && typeof r.metier === "string" && typeof r.telecom === "string" && typeof r.objectif === "string"
      ? { metier: r.metier, telecom: r.telecom, objectif: r.objectif }
      : null;
  } catch {
    return null;
  }
}

/** Enregistre (ou oublie, avec `null`) les réponses au diagnostic, et prévient les composants abonnés. */
export function enregistrerReponses(reponses: ReponsesEnregistrees | null) {
  try {
    if (reponses) localStorage.setItem(CLE, JSON.stringify(reponses));
    else localStorage.removeItem(CLE);
  } catch {
    // stockage indisponible : le diagnostic fonctionne, sans mémoire d'une visite à l'autre
  }
  window.dispatchEvent(new Event(EVENEMENT));
}

/**
 * Réponses enregistrées dans ce navigateur. `pret` est faux tant que le stockage n'a pas été lu
 * (rendu serveur, première hydratation) : on ne peut alors rien conclure.
 */
export function useReponsesEnregistrees(): { reponses: ReponsesEnregistrees | null; pret: boolean } {
  const brut = useSyncExternalStore(abonner, lire, () => null);
  const pret = useSyncExternalStore(abonner, () => true, () => false);
  const reponses = useMemo(() => lireReponses(brut), [brut]);
  return { reponses, pret };
}
