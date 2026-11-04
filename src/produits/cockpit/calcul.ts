import { ajouterJours, jourLocal } from "@/lib/jour";
import { ancetres, cheminCritique, etats, prochaineEtape, type Suite } from "@/lib/objectif";
import type { Orientation } from "@/lib/orientation-schema";
import { effort, investissementNoeud, type Effort, type Investissement } from "@/lib/palier";
import type { Noeud, Roadmap } from "@/lib/schema";
import type { Decompte, Progression, StatutPratique, SuiviNoeud } from "@/produits/progression";

/**
 * Cockpit : tout ce qu'il faut savoir d'un parcours pour s'y mettre, calculé d'un coup. Pur : la date et le suivi sont des entrées.
 * Pas d'heures : chaque compétence a un palier visé pour le rôle (champ `cible` de la roadmap) et un investissement léger, moyen
 * ou long (table de content/orientation.json, hypothèse éditoriale). Le rythme se compte en compétences par semaine.
 */

export type TableInvestissement = NonNullable<Orientation["investissement_par_palier"]>;
export type NoeudEntree = Pick<Noeud, "id" | "titre" | "bloc" | "niveau" | "cible">;
/** Le minimum d'une roadmap pour construire un programme (suffit au diagnostic, sans les prérequis). */
export type RoadmapProgramme = { id: string; blocs: string[]; noeuds: NoeudEntree[] };

export type StatutProgramme = StatutPratique | "hors-parcours";

export type NoeudProgramme = NoeudEntree & { /** Léger, moyen ou long au palier visé ; absent sans palier cible. */ investissement?: Investissement; /** Palier atteint (0 à 5), seulement quand le suivi est fourni. */ palier?: number; statut: StatutProgramme };

export type BlocProgramme = {
  bloc: string;
  noeuds: NoeudProgramme[];
  /** Compétences du parcours (hors celles que la personne a sorties). */
  actifs: number;
  acquis: number;
  /** Compétences restant à acquérir dans ce bloc (« à revoir » compte comme acquis, comme dans le décompte). */
  restantes: number;
  /** Léger, moyen, long : répartition des compétences du parcours dans ce bloc, à leur palier visé. */
  effort: Effort;
  /** Semaine où le bloc s'achève, au rythme donné, en enchaînant les blocs dans l'ordre ; absent si le bloc est terminé. */
  semaineFin?: number;
};

export type Programme = {
  roadmapId: string;
  blocs: BlocProgramme[];
  restantes: number;
  actifs: number;
  acquis: number;
  effort: Effort;
};

const estFait = (s: StatutProgramme) => s === "acquis-teste" || s === "a-revoir";

/** Les blocs dans l'ordre de la roadmap, leurs compétences, leur investissement. Sans `suivi` : rien n'est commencé. Un bloc vide est omis. */
export function calculerProgramme(roadmap: RoadmapProgramme, table: TableInvestissement, suivi?: (id: string) => Pick<SuiviNoeud, "statut" | "horsParcours"> & Partial<Pick<SuiviNoeud, "palier">>): Programme {
  const blocs: BlocProgramme[] = roadmap.blocs.flatMap((bloc) => {
    const noeuds: NoeudProgramme[] = roadmap.noeuds
      .filter((n) => n.bloc === bloc)
      .map((n) => {
        const s = suivi?.(n.id);
        return { id: n.id, titre: n.titre, bloc: n.bloc, niveau: n.niveau, cible: n.cible, investissement: investissementNoeud(table, n), ...(s?.palier !== undefined && { palier: s.palier }), statut: s?.horsParcours ? "hors-parcours" : (s?.statut ?? "a-decouvrir") };
      });
    if (noeuds.length === 0) return [];
    const actifs = noeuds.filter((n) => n.statut !== "hors-parcours");
    const acquis = actifs.filter((n) => estFait(n.statut)).length;
    return [{ bloc, noeuds, actifs: actifs.length, acquis, restantes: actifs.length - acquis, effort: effort(actifs, table) }];
  });
  const somme = (k: "restantes" | "actifs" | "acquis") => blocs.reduce((t, b) => t + b[k], 0);
  const total: Effort = { legers: 0, moyens: 0, longs: 0 };
  for (const b of blocs) {
    total.legers += b.effort.legers;
    total.moyens += b.effort.moyens;
    total.longs += b.effort.longs;
  }
  return { roadmapId: roadmap.id, blocs, restantes: somme("restantes"), actifs: somme("actifs"), acquis: somme("acquis"), effort: total };
}

/** Numérote la semaine de fin de chaque bloc restant (cumul des compétences restantes, dans l'ordre des blocs, au rythme en compétences par semaine). */
export function placerSemaines(programme: Programme, rythme: number): Programme {
  let cumul = 0;
  return { ...programme, blocs: programme.blocs.map((b) => ({ ...b, semaineFin: b.restantes > 0 ? Math.ceil((cumul += b.restantes) / rythme) : undefined })) };
}

export type Projection = { semaines: number; /** « AAAA-MM-JJ » ; null s'il n'y a plus rien à faire. */ arrivee: string | null };

/** Combien de semaines au rythme choisi (compétences par semaine), et quel jour on arrive (aujourd'hui + n semaines). Rien à faire : rien à projeter. */
export function projeter(competencesRestantes: number, rythme: number, now: Date): Projection {
  if (competencesRestantes <= 0 || rythme <= 0) return { semaines: 0, arrivee: null };
  const semaines = Math.ceil(competencesRestantes / rythme);
  return { semaines, arrivee: ajouterJours(jourLocal(now), semaines * 7) };
}

export type ObjectifCockpit = {
  id: string;
  titre: string;
  /** Compétences encore à acquérir pour l'atteindre (lui compris, acquis et sorties exclus). */
  restantes: number;
  /** Léger, moyen, long : ce qu'il reste à acquérir pour l'atteindre. */
  effort: Effort;
  /** Chaîne de prérequis la plus longue qui reste à parcourir en séquence. */
  etapesCritiques: number;
  chemin: { id: string; titre: string }[];
  projection: Projection;
};

export type Cockpit = {
  programme: Programme;
  /** Compétences au palier visé pour ce rôle, sur celles qui ont un palier visé (hors parcours exclues). */
  paliers: { vises: number; atteints: number };
  decompte: Decompte;
  rythme: number;
  projection: Projection;
  suite: Suite;
  revision: { total: number; premier: { id: string; titre: string } | null };
  /** Prochaines révisions planifiées dans ce parcours (après aujourd'hui), les plus proches d'abord. */
  aVenir: { id: string; titre: string; jour: string }[];
  objectif: ObjectifCockpit | null;
};

type Entree = {
  roadmap: Roadmap;
  table: TableInvestissement;
  rythme: number;
  now: Date;
  decompte: Decompte;
  suivi: (id: string) => SuiviNoeud;
  /** Compétences à réviser aujourd'hui (toutes roadmaps) : on ne garde que celles de cette roadmap. */
  echeances: string[];
  /** Calendrier des révisions (toutes roadmaps) : on ne garde que les futures de cette roadmap. */
  calendrier?: { id: string; echeance: string }[];
  cibleId: string | null;
  /** Vue à quatre statuts de la roadmap (useProgression). */
  progression: Progression;
};

/** Assemble le cockpit d'une roadmap : programme et investissement, projection, prochaine étape, révisions dues, objectif et chemin critique. */
export function calculerCockpit({ roadmap, table, rythme, now, decompte, suivi, echeances, calendrier = [], cibleId, progression }: Entree): Cockpit {
  const programme = placerSemaines(calculerProgramme(roadmap, table, suivi), rythme);
  const parId = new Map(roadmap.noeuds.map((n) => [n.id, n]));
  const dues = echeances.filter((id) => parId.has(id));
  const premier = dues[0] ? parId.get(dues[0])! : null;

  let objectif: ObjectifCockpit | null = null;
  const cible = cibleId ? parId.get(cibleId) : undefined;
  if (cible) {
    const ids = ancetres(roadmap, cible.id);
    const etat2 = etats(roadmap, ids, progression);
    const aFaire = roadmap.noeuds.filter((n) => ids.has(n.id) && ["disponible", "verrouille"].includes(etat2.get(n.id) ?? ""));
    const critique = cheminCritique(roadmap, cible.id, progression);
    objectif = {
      id: cible.id,
      titre: cible.titre,
      restantes: aFaire.length,
      effort: effort(aFaire, table),
      etapesCritiques: critique.etapesRestantes,
      chemin: critique.chemin.map((id) => ({ id, titre: parId.get(id)!.titre })),
      projection: projeter(aFaire.length, rythme, now),
    };
  }

  const paliers = { vises: 0, atteints: 0 };
  for (const n of roadmap.noeuds) {
    const s = suivi(n.id);
    if (s.horsParcours || n.cible === undefined) continue;
    paliers.vises++;
    if (s.palier >= n.cible) paliers.atteints++;
  }

  return {
    programme,
    paliers,
    decompte,
    rythme,
    projection: projeter(programme.restantes, rythme, now),
    suite: prochaineEtape(roadmap, progression),
    revision: { total: dues.length, premier: premier ? { id: premier.id, titre: premier.titre } : null },
    aVenir: calendrier
      .filter((c) => parId.has(c.id) && c.echeance > jourLocal(now))
      .slice(0, 4)
      .map((c) => ({ id: c.id, titre: parId.get(c.id)!.titre, jour: c.echeance })),
    objectif,
  };
}
