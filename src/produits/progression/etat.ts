import { z } from "zod";
import type { Progression } from "./progression";
import { ajouterJours, ecartJours, jourLocal } from "@/lib/jour";
import type { Noeud, Roadmap } from "@/lib/schema";

export { ajouterJours, ecartJours, jourLocal };

/**
 * Modèle de progression par la pratique (voir DESIGN.md §3).
 * - « Acquis (testé) » n'existe qu'après un rappel réussi, daté. Jamais sur simple déclaration.
 * - Révisions à J+1, J+3, J+7, J+21 (boîtes de Leitner), calculées à partir de dates stockées dans le navigateur.
 * - Tout est pur : la date courante est toujours passée en paramètre.
 */

/** Intervalles des boîtes 1 à 4, en jours. */
export const INTERVALLES_JOURS = [1, 3, 7, 21] as const;

export type Boite = 1 | 2 | 3 | 4;
export type StatutPratique = "a-decouvrir" | "vu" | "acquis-teste" | "a-revoir";

const jour = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const EtatNoeudSchema = z.object({
  /** Premier jour où la compétence a été vue (segments lus, question répondue, ou ancien statut). */
  vu: jour.optional(),
  boite: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
  /** Jour du dernier rappel réussi. */
  reussi: jour.optional(),
  /** Jour à partir duquel la révision est due. */
  echeance: jour.optional(),
  /** Résultat du dernier rappel tenté. */
  dernier: z.enum(["ok", "echec"]).optional(),
  tentatives: z.number().int().min(0).optional(),
  /** Vrai si la compétence était « maîtrisée » par simple déclaration dans l'ancien système : elle est « vue », à confirmer par un test. */
  declare: z.literal(true).optional(),
  /** Palier atteint déclaré par la personne (1 à 5, voir DEFINITION_PALIER). Au-delà du palier 1 (rappel réussi), rien ne le vérifie : c'est une déclaration. */
  palier: z.number().int().min(1).max(5).optional(),
  /** Notions cochées d'une fiche, en masque de bits (bit i = notion i, 30 au plus). Auto-évaluation : ne compte ni dans le palier atteint ni dans « acquis (testé) ». */
  notions: z.number().int().min(1).max(2 ** 30 - 1).optional(),
});

export const EtatPratiqueSchema = z.object({
  version: z.literal(1),
  creeLe: jour,
  /** Les anciennes progressions (`tcr:progression:*`) ont été reprises. */
  migre: z.boolean(),
  /** Nombre de compétences déclarées « maîtrisées » reprises comme « vues » par la migration. */
  declares: z.number().int().min(0),
  /** Le message unique qui explique la migration a été lu. */
  messageMigrationVu: z.boolean(),
  noeuds: z.record(z.string(), EtatNoeudSchema),
  /** Parcours sur lesquels la personne a agi, du plus récent au plus ancien : le premier est « mon parcours ». */
  parcours: z.array(z.string()).default([]),
  /** Compétences sorties du parcours, par roadmap (ce n'est pas un statut). */
  horsParcours: z.record(z.string(), z.array(z.string())),
  /** Rythme d'étude choisi, en compétences par semaine (absent : RYTHME_DEFAUT). Sert aux projections du cockpit, jamais à un statut. Les états enregistrés quand le rythme se comptait en heures (jusqu'à 40) restent lisibles : la valeur est ramenée dans les bornes à la lecture. */
  rythme: z.number().int().min(1).max(40).optional(),
});

export type EtatNoeud = z.infer<typeof EtatNoeudSchema>;
export type EtatPratique = z.infer<typeof EtatPratiqueSchema>;

/** Rythme d'étude : défaut et bornes (compétences par semaine). */
export const RYTHME_DEFAUT = 2;
export const RYTHME_MIN = 1;
export const RYTHME_MAX = 10;

/** Rythme choisi, ou le défaut. */
export const rythmeDe = (etat: Pick<EtatPratique, "rythme">): number => Math.min(RYTHME_MAX, Math.max(RYTHME_MIN, etat.rythme ?? RYTHME_DEFAUT));

/** Fixe le rythme (arrondi à la compétence, borné). */
export function definirRythme(etat: EtatPratique, competencesParSemaine: number): EtatPratique {
  const n = Math.min(RYTHME_MAX, Math.max(RYTHME_MIN, Math.round(competencesParSemaine)));
  return { ...etat, rythme: n };
}

export const etatVide = (now: Date): EtatPratique => ({ version: 1, creeLe: jourLocal(now), migre: false, declares: 0, messageMigrationVu: false, noeuds: {}, parcours: [], horsParcours: {} });

/** Lecture tolérante : toute donnée illisible redonne un état vide, jamais une erreur. */
export function lireEtat(brut: string | null, now: Date): EtatPratique {
  if (!brut) return etatVide(now);
  try {
    const res = EtatPratiqueSchema.safeParse(JSON.parse(brut));
    return res.success ? res.data : etatVide(now);
  } catch {
    return etatVide(now);
  }
}

export const serialiserEtat = (etat: EtatPratique): string => JSON.stringify(etat);

const avec = (etat: EtatPratique, id: string, n: EtatNoeud): EtatPratique => ({ ...etat, noeuds: { ...etat.noeuds, [id]: n } });

/** Statut affiché. « À revoir » : échéance atteinte, ou dernier rappel raté. */
export function statutPratique(etat: EtatPratique, id: string, now: Date): StatutPratique {
  const n = etat.noeuds[id];
  if (!n) return "a-decouvrir";
  if (n.boite) return n.dernier === "echec" || (n.echeance !== undefined && n.echeance <= jourLocal(now)) ? "a-revoir" : "acquis-teste";
  return n.vu ? "vu" : "a-decouvrir";
}

/** Palier atteint pour une compétence : 0 si rien, 1 après un rappel réussi, ou le palier déclaré s'il est plus haut. Indépendant du rôle : c'est ce que la personne sait faire. */
export function palierAtteint(etat: EtatPratique, id: string): number {
  const n = etat.noeuds[id];
  if (!n) return 0;
  return Math.max(n.boite ? 1 : 0, n.palier ?? 0);
}

/** Déclare le palier atteint (1 à 5), ou l'efface (`null`). N'écrit jamais « acquis (testé) » : seul un rappel réussi le fait. */
export function definirPalier(etat: EtatPratique, id: string, palier: number | null): EtatPratique {
  const n = etat.noeuds[id] ?? {};
  const { palier: _ancien, ...reste } = n;
  void _ancien;
  if (palier === null || palier < 1) {
    if (Object.keys(reste).length === 0) {
      const { [id]: _retire, ...autres } = etat.noeuds;
      void _retire;
      return { ...etat, noeuds: autres };
    }
    return avec(etat, id, reste);
  }
  return avec(etat, id, { ...reste, palier: Math.min(5, Math.round(palier)) });
}

/** Indices des notions cochées pour une compétence. */
export function notionsCochees(etat: EtatPratique, id: string): number[] {
  const masque = etat.noeuds[id]?.notions ?? 0;
  return Array.from({ length: 30 }, (_, i) => i).filter((i) => (masque & (1 << i)) !== 0);
}

/** Coche ou décoche une notion. N'a aucun effet sur le palier atteint ni sur le statut : c'est une auto-évaluation, pas une preuve. */
export function basculerNotion(etat: EtatPratique, id: string, index: number): EtatPratique {
  if (!Number.isInteger(index) || index < 0 || index > 29) return etat;
  const n = etat.noeuds[id] ?? {};
  const masque = (n.notions ?? 0) ^ (1 << index);
  const { notions: _ancien, ...reste } = n;
  void _ancien;
  if (masque === 0) {
    if (Object.keys(reste).length === 0) {
      const { [id]: _retire, ...autres } = etat.noeuds;
      void _retire;
      return { ...etat, noeuds: autres };
    }
    return avec(etat, id, reste);
  }
  return avec(etat, id, { ...reste, notions: masque });
}

/** Met un parcours en tête de « mes parcours » : à appeler quand la personne **agit** (marquer, rappel, suivre), pas quand elle consulte. */
export function suivreParcours(etat: EtatPratique, roadmapId: string): EtatPratique {
  return etat.parcours[0] === roadmapId ? etat : { ...etat, parcours: [roadmapId, ...etat.parcours.filter((x) => x !== roadmapId)] };
}

/** Marque une compétence comme vue (sans effet si elle l'est déjà ou si elle est acquise). */
export function marquerVu(etat: EtatPratique, id: string, now: Date): EtatPratique {
  const n = etat.noeuds[id] ?? {};
  return n.vu ? etat : avec(etat, id, { ...n, vu: jourLocal(now) });
}

/** Annule « vu ». Impossible pour une compétence acquise : on ne perd pas une preuve en cliquant. */
export function retirerVu(etat: EtatPratique, id: string): EtatPratique {
  const n = etat.noeuds[id];
  if (!n || n.boite) return etat;
  const { [id]: _retire, ...reste } = etat.noeuds;
  void _retire;
  return { ...etat, noeuds: reste };
}

/** Sort ou remet une compétence dans le parcours d'une roadmap. */
export function definirHorsParcours(etat: EtatPratique, roadmapId: string, id: string, hors: boolean): EtatPratique {
  const actuels = etat.horsParcours[roadmapId] ?? [];
  const suite = hors ? [...new Set([...actuels, id])] : actuels.filter((x) => x !== id);
  const horsParcours = { ...etat.horsParcours };
  if (suite.length > 0) horsParcours[roadmapId] = suite;
  else delete horsParcours[roadmapId];
  return { ...etat, horsParcours };
}

/**
 * Enregistre le résultat d'un rappel.
 * - Premier succès : boîte 1, révision à J+1. C'est le seul moyen d'être « acquis (testé) ».
 * - Succès quand la révision est due : boîte suivante (J+3, J+7, J+21, puis J+21 de nouveau).
 * - Succès avant l'échéance : la tentative est comptée, la planification ne bouge pas (l'espacement ne se contourne pas en retestant tout de suite).
 * - Échec d'une compétence acquise : retour en boîte 1, révision le lendemain.
 * - Échec d'une compétence jamais acquise : elle reste « vue ».
 */
export function enregistrerRappel(etat: EtatPratique, id: string, ok: boolean, now: Date): EtatPratique {
  const aujourdhui = jourLocal(now);
  const n = etat.noeuds[id] ?? {};
  const tentatives = (n.tentatives ?? 0) + 1;
  const base: EtatNoeud = { ...n, vu: n.vu ?? aujourdhui, tentatives };

  if (!ok) return avec(etat, id, n.boite ? { ...base, boite: 1, echeance: ajouterJours(aujourdhui, INTERVALLES_JOURS[0]), dernier: "echec" } : { ...base, dernier: "echec" });

  const { declare: _declare, ...sansDeclaration } = base;
  void _declare;
  if (!n.boite) return avec(etat, id, { ...sansDeclaration, boite: 1, reussi: aujourdhui, echeance: ajouterJours(aujourdhui, INTERVALLES_JOURS[0]), dernier: "ok" });

  const due = n.echeance !== undefined && n.echeance <= aujourdhui;
  if (!due) return avec(etat, id, sansDeclaration);
  const boite = Math.min(n.boite + 1, 4) as Boite;
  return avec(etat, id, { ...sansDeclaration, boite, reussi: aujourdhui, echeance: ajouterJours(aujourdhui, INTERVALLES_JOURS[boite - 1]), dernier: "ok" });
}

/** Compétences à réviser aujourd'hui (échéance atteinte), les plus en retard d'abord. */
export function echues(etat: EtatPratique, now: Date): string[] {
  const aujourdhui = jourLocal(now);
  return Object.entries(etat.noeuds)
    .filter(([, n]) => n.boite && n.echeance !== undefined && n.echeance <= aujourdhui)
    .sort(([ida, a], [idb, b]) => a.echeance!.localeCompare(b.echeance!) || ida.localeCompare(idb))
    .map(([id]) => id);
}

/** Prochaines échéances (futures comprises), pour l'export de calendrier. */
export function prochainesEcheances(etat: EtatPratique): { id: string; echeance: string }[] {
  return Object.entries(etat.noeuds)
    .filter(([, n]) => n.boite && n.echeance)
    .map(([id, n]) => ({ id, echeance: n.echeance! }))
    .sort((a, b) => a.echeance.localeCompare(b.echeance) || a.id.localeCompare(b.id));
}

export type DecomptePaliers = { /** Compétences du parcours qui ont un palier visé (hors celles sorties du parcours). */ vises: number; /** Parmi elles, celles dont le palier atteint est au moins le palier visé. */ atteints: number };

/** Combien de compétences sont au palier visé pour ce rôle. Les compétences sans palier cible ne comptent pas, ni celles sorties du parcours. */
export function compterPaliers(etat: EtatPratique, roadmapId: string, noeuds: Pick<Noeud, "id" | "cible">[]): DecomptePaliers {
  const hors = new Set(etat.horsParcours[roadmapId] ?? []);
  let vises = 0;
  let atteints = 0;
  for (const { id, cible } of noeuds) {
    if (hors.has(id) || cible === undefined) continue;
    vises++;
    if (palierAtteint(etat, id) >= cible) atteints++;
  }
  return { vises, atteints };
}

export type Decompte = { total: number; horsParcours: number; actifs: number; acquis: number; aRevoir: number; vus: number; pourcentage: number };

/** « À revoir » compte comme acquis (décision validée) ; il est dénombré à part pour être montré. Les compétences hors parcours sortent du dénominateur. */
export function compter(etat: EtatPratique, roadmapId: string, noeuds: Pick<Noeud, "id">[], now: Date): Decompte {
  const hors = new Set(etat.horsParcours[roadmapId] ?? []);
  let acquis = 0;
  let aRevoir = 0;
  let vus = 0;
  for (const { id } of noeuds) {
    if (hors.has(id)) continue;
    const s = statutPratique(etat, id, now);
    if (s === "acquis-teste") acquis++;
    else if (s === "a-revoir") {
      acquis++;
      aRevoir++;
    } else if (s === "vu") vus++;
  }
  const actifs = noeuds.length - noeuds.filter((n) => hors.has(n.id)).length;
  return { total: noeuds.length, horsParcours: noeuds.length - actifs, actifs, acquis, aRevoir, vus, pourcentage: actifs === 0 ? 0 : Math.round((acquis / actifs) * 100) };
}

/**
 * Vue de compatibilité : les graphes, la liste, le mode objectif et le projet lisent encore une `Progression` à 4 statuts.
 * « acquis » et « à revoir » → maitrise ; « vu » → en-cours ; hors parcours → ignore.
 */
export function vueProgression(etat: EtatPratique, roadmap: Pick<Roadmap, "id"> & { noeuds: Pick<Noeud, "id">[] }, now: Date): Progression {
  const hors = new Set(etat.horsParcours[roadmap.id] ?? []);
  const vue: Progression = {};
  for (const { id } of roadmap.noeuds) {
    if (hors.has(id)) {
      vue[id] = "ignore";
      continue;
    }
    const s = statutPratique(etat, id, now);
    if (s === "acquis-teste" || s === "a-revoir") vue[id] = "maitrise";
    else if (s === "vu") vue[id] = "en-cours";
  }
  return vue;
}

/**
 * Reprend une ancienne progression (stockage `tcr:progression:*`, import de fichier, lien de sauvegarde) :
 * « maîtrisé » déclaré devient « vu » (jamais « acquis ») et garde la marque `declare` ; « en cours » devient « vu » ; « ignoré » sort du parcours.
 * Une compétence déjà acquise par un test n'est jamais rétrogradée.
 */
export function reprendreProgression(etat: EtatPratique, roadmapId: string, prog: Progression, now: Date): EtatPratique {
  let suite = etat;
  const jourCourant = jourLocal(now);
  for (const [id, statut] of Object.entries(prog)) {
    if (statut === "ignore") {
      suite = definirHorsParcours(suite, roadmapId, id, true);
      continue;
    }
    if (statut !== "maitrise" && statut !== "en-cours") continue;
    const n = suite.noeuds[id] ?? {};
    if (n.boite) continue;
    suite = avec(suite, id, { ...n, vu: n.vu ?? jourCourant, ...(statut === "maitrise" ? { declare: true as const } : {}) });
  }
  return suite;
}

/** Migration unique des anciennes progressions : toutes les roadmaps, sans rien supprimer des anciennes clés. Idempotente. */
export function migrer(etat: EtatPratique, anciennes: Record<string, Progression>, now: Date): EtatPratique {
  if (etat.migre) return etat;
  let suite = etat;
  for (const [roadmapId, prog] of Object.entries(anciennes)) suite = reprendreProgression(suite, roadmapId, prog, now);
  const declares = Object.values(suite.noeuds).filter((n) => n.declare).length;
  const suivis = Object.entries(anciennes)
    .filter(([, prog]) => Object.keys(prog).length > 0)
    .map(([id]) => id)
    .filter((id) => !suite.parcours.includes(id));
  return { ...suite, migre: true, declares, parcours: [...suite.parcours, ...suivis] };
}

/** Efface les statuts et les révisions des compétences d'une roadmap (action explicite de la personne). */
export function reinitialiserRoadmap(etat: EtatPratique, roadmap: Pick<Roadmap, "id" | "noeuds">): EtatPratique {
  const ids = new Set(roadmap.noeuds.map((n) => n.id));
  const noeuds = Object.fromEntries(Object.entries(etat.noeuds).filter(([id]) => !ids.has(id)));
  const horsParcours = { ...etat.horsParcours };
  delete horsParcours[roadmap.id];
  return { ...etat, noeuds, horsParcours, parcours: etat.parcours.filter((x) => x !== roadmap.id) };
}

/** Ce que l'interface affiche pour une compétence. */
export type SuiviNoeud = { statut: StatutPratique; echeance?: string; declare: boolean; horsParcours: boolean; /** Palier atteint (0 à 5). */ palier: number };

export function suiviNoeud(etat: EtatPratique, roadmapId: string, id: string, now: Date): SuiviNoeud {
  const n = etat.noeuds[id];
  return {
    statut: statutPratique(etat, id, now),
    echeance: n?.boite ? n.echeance : undefined,
    declare: n?.declare === true,
    horsParcours: (etat.horsParcours[roadmapId] ?? []).includes(id),
    palier: palierAtteint(etat, id),
  };
}

/** Retire les statuts déclarés (vu, déclaré, hors parcours) des compétences d'une roadmap, mais **jamais** celles acquises par un test. */
export function effacerDeclarations(etat: EtatPratique, roadmap: Pick<Roadmap, "id" | "noeuds">): EtatPratique {
  const ids = new Set(roadmap.noeuds.map((n) => n.id));
  const noeuds: Record<string, EtatNoeud> = {};
  for (const [id, n] of Object.entries(etat.noeuds)) {
    if (!ids.has(id) || n.boite) noeuds[id] = n;
    // Un palier déclaré et des notions cochées ne sont pas des statuts (« vu », « maîtrisé ») : ils survivent à l'import d'une progression.
    else if (n.palier || n.notions) noeuds[id] = { ...(n.palier ? { palier: n.palier } : {}), ...(n.notions ? { notions: n.notions } : {}) };
  }
  const horsParcours = { ...etat.horsParcours };
  delete horsParcours[roadmap.id];
  return { ...etat, noeuds, horsParcours };
}
