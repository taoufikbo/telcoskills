"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { suivre } from "@/produits/mesure";
import { RYTHME_DEFAUT, definirRythme, echues, ecartJours, rythmeDe, enregistrerRappel as enregistrer, etatVide, jourLocal, lireEtat, migrer, serialiserEtat, type EtatPratique } from "./etat";
import { lireStatuts, type Progression } from "./progression";

const CLE = "tcr:pratique";
const PREFIXE_ANCIEN = "tcr:progression:";
const EVENEMENT = "tcr:pratique-maj";

/** Instantané du stockage : le nouvel état et, tant qu'il existe, les anciennes progressions par roadmap. Une chaîne : comparée par valeur. */
function lireStockage(): string {
  try {
    const anciennes: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIXE_ANCIEN)) anciennes[k.slice(PREFIXE_ANCIEN.length)] = localStorage.getItem(k) ?? "";
    }
    return JSON.stringify({ p: localStorage.getItem(CLE), a: anciennes });
  } catch {
    return "";
  }
}

const abonner = (cb: () => void) => {
  window.addEventListener(EVENEMENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENEMENT, cb);
    window.removeEventListener("storage", cb);
  };
};

/** Le jour change à minuit et quand l'onglet revient au premier plan : les révisions « dues aujourd'hui » se mettent à jour sans recharger. */
const abonnerJour = (cb: () => void) => {
  const minuteur = window.setInterval(cb, 60_000);
  document.addEventListener("visibilitychange", cb);
  window.addEventListener("focus", cb);
  return () => {
    window.clearInterval(minuteur);
    document.removeEventListener("visibilitychange", cb);
    window.removeEventListener("focus", cb);
  };
};

const midi = (j: string) => new Date(`${j}T12:00:00`);

/** État effectif : l'état stocké, avec la migration des anciennes progressions appliquée s'il n'a pas encore été persisté. */
function deriver(instantane: string, now: Date): { etat: EtatPratique; aPersister: boolean } {
  let p: string | null = null;
  let anciennes: Record<string, string> = {};
  try {
    const brut = JSON.parse(instantane || "{}") as { p?: string | null; a?: Record<string, string> };
    p = brut.p ?? null;
    anciennes = brut.a ?? {};
  } catch {
    // instantané illisible : on repart d'un état vide
  }
  const stocke = lireEtat(p, now);
  if (stocke.migre) return { etat: stocke, aPersister: false };
  const parRoadmap: Record<string, Progression> = Object.fromEntries(Object.entries(anciennes).map(([id, brut]) => [id, lireStatuts(brut)]));
  return { etat: migrer(stocke, parRoadmap, now), aPersister: true };
}

function ecrire(etat: EtatPratique) {
  try {
    localStorage.setItem(CLE, serialiserEtat(etat));
  } catch {
    // stockage indisponible (navigation privée, quota) : la progression n'est pas sauvegardée
  }
  window.dispatchEvent(new Event(EVENEMENT));
}

/** Progression par la pratique, partagée entre toutes les roadmaps (une compétence = un état, quelle que soit la roadmap). */
export function usePratique() {
  const instantane = useSyncExternalStore(abonner, lireStockage, () => "");
  const aujourdhui = useSyncExternalStore(abonnerJour, () => jourLocal(new Date()), () => "");
  const now = useMemo(() => (aujourdhui ? midi(aujourdhui) : new Date(0)), [aujourdhui]);
  const { etat, aPersister } = useMemo(() => deriver(instantane, now), [instantane, now]);

  // La migration est écrite une seule fois ; les anciennes clés ne sont jamais supprimées.
  useEffect(() => {
    if (aPersister && instantane) ecrire(etat);
  }, [aPersister, instantane, etat]);

  /** Applique une modification à l'état le plus récent du stockage (pas à une copie périmée). */
  const muter = useCallback((f: (e: EtatPratique, now: Date) => EtatPratique) => {
    const maintenant = new Date();
    const { etat: courant } = deriver(lireStockage(), maintenant);
    ecrire(f(courant, maintenant));
  }, []);

  const enregistrerRappel = useCallback(
    (id: string, ok: boolean) =>
      muter((e, n) => {
        if (ok && !e.noeuds[id]?.boite) {
          // Première acquisition de la personne ? Alors on mesure le délai depuis sa première visite (jours), sans identifiant.
          const premiere = !Object.values(e.noeuds).some((n) => n.boite);
          suivre("node_done", premiere ? { noeud: id, premiere: true, delaiJours: ecartJours(e.creeLe, jourLocal(n)) } : { noeud: id, premiere: false });
        }
        return enregistrer(e, id, ok, n);
      }),
    [muter],
  );

  const marquerMigrationLue = useCallback(() => muter((e) => ({ ...e, messageMigrationVu: true })), [muter]);

  return { etat, now, muter, enregistrerRappel, marquerMigrationLue, pret: aujourdhui !== "" };
}

export { etatVide };

/** Nombre de révisions dues aujourd'hui, toutes roadmaps confondues (0 tant que l'état local n'est pas lu). */
export function useDues(): number {
  const { etat, now, pret } = usePratique();
  return pret ? echues(etat, now).length : 0;
}

/** Ids des compétences à réviser aujourd'hui, toutes roadmaps confondues (vide tant que l'état local n'est pas lu). */
export function useEcheances(): string[] {
  const { etat, now, pret } = usePratique();
  return useMemo(() => (pret ? echues(etat, now) : []), [etat, now, pret]);
}

/** Rythme d'étude (heures par semaine), mémorisé dans l'état de pratique. Le défaut s'applique tant que rien n'est choisi. */
export function useRythme() {
  const { etat, muter, pret } = usePratique();
  const definir = useCallback((h: number) => muter((e) => definirRythme(e, h)), [muter]);
  return { rythme: pret ? rythmeDe(etat) : RYTHME_DEFAUT, definir };
}
