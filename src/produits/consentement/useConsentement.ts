"use client";

import { useCallback, useSyncExternalStore } from "react";
import { jourLocal } from "@/lib/jour";
import { lireChoix, serialiserChoix, type Choix } from "./regles";

const CLE = "tcr:consentement";
const EVENEMENT = "tcr:consentement-maj";

/** Instantané brut du stockage : « undefined » côté serveur (pas encore lu), « null » sans choix. */
const lire = (): string | null => {
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

/** Choix de mesure d'audience, mémorisé dans le navigateur (seul propriétaire de `tcr:consentement`). Sans choix, rien n'est mesuré. */
export function useConsentement() {
  const brut = useSyncExternalStore<string | null | undefined>(abonner, lire, () => undefined);
  const pret = brut !== undefined;
  const choix: Choix | null = pret ? lireChoix(brut, jourLocal(new Date())) : null;

  const ecrire = useCallback((valeur: string | null) => {
    try {
      if (valeur === null) localStorage.removeItem(CLE);
      else localStorage.setItem(CLE, valeur);
    } catch {
      // stockage indisponible : le choix vaut pour cette page seulement
    }
    window.dispatchEvent(new Event(EVENEMENT));
  }, []);

  const accepter = useCallback(() => ecrire(serialiserChoix("accepte", jourLocal(new Date()))), [ecrire]);
  /** Refuser après avoir accepté : le script de mesure déjà chargé ne se décharge pas, on recharge la page pour qu'il disparaisse. */
  const refuser = useCallback(() => {
    const avait = lireChoix(lire(), jourLocal(new Date())) === "accepte";
    ecrire(serialiserChoix("refuse", jourLocal(new Date())));
    if (avait) window.location.reload();
  }, [ecrire]);
  /** « Gérer mes choix » : efface le choix, le bandeau revient. */
  const rouvrir = useCallback(() => ecrire(null), [ecrire]);

  return { choix, pret, accepter, refuser, rouvrir };
}
