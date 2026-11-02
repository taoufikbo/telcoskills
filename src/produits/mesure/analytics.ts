import { jourLocal } from "@/lib/jour";

/**
 * Mesure d'audience sans cookie tiers (Vercel Web Analytics, à activer dans le tableau de bord du projet).
 * Les événements sont envoyés avec window.va ; sans le script (développement, instance interne), rien ne part.
 */
export const EVENEMENTS = [
  "review_due_shown",
  "review_done",
  "ics_export",
  "bloc_skip_test",
  "pretest_answer",
  "segment_view",
  "recall_attempt",
  "recall_success",
  "quiz_start",
  "quiz_complete",
  "roadmap_open",
  "node_done",
  "contact_submit",
  "cta_clic",
  "abonnement",
  "contact_clic",
  "diagnostic_termine",
  "export_progression",
] as const;
export type Evenement = (typeof EVENEMENTS)[number];

declare global {
  interface Window {
    va?: (action: "event", donnees: { name: string; data?: Record<string, string | number | boolean> }) => void;
  }
}

export function suivre(nom: Evenement, donnees?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return;
  try {
    window.va?.("event", { name: nom, data: donnees });
  } catch {
    // la mesure ne doit jamais gêner la navigation
  }
}

type Stockage = Pick<Storage, "getItem" | "setItem">;

function stockageNavigateur(): Stockage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

/**
 * Vrai la première fois, dans la journée, pour cette clé et ce navigateur ; faux ensuite. Sert à compter des **navigateurs-jours**
 * (et non des clics) quand il n'y a aucun identifiant : c'est le substitut, sans cookie, d'un « utilisateur actif du jour ».
 */
export function premiereFoisAujourdhui(cle: string, stockage: Stockage | null = stockageNavigateur(), jour: string = jourLocal(new Date())): boolean {
  if (!stockage) return false;
  const k = `tcr:mesure:${cle}`;
  try {
    if (stockage.getItem(k) === jour) return false;
    stockage.setItem(k, jour);
    return true;
  } catch {
    return false;
  }
}

/** Envoie l'événement au plus une fois par jour et par navigateur ; ne marque rien tant que la mesure n'est pas active. */
export function suivreUnParJour(nom: Evenement, donnees?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined" || typeof window.va !== "function") return;
  if (premiereFoisAujourdhui(nom)) suivre(nom, donnees);
}
