import { heuresEstimees } from "@/lib/duree";
import { ajouterJours, jourLocal } from "@/lib/jour";
import { ancetres, cheminCritique, etats, prochaineEtape, type Suite } from "@/lib/objectif";
import type { Orientation } from "@/lib/orientation-schema";
import type { Noeud, Roadmap } from "@/lib/schema";
import type { Decompte, Progression, StatutPratique, SuiviNoeud } from "@/produits/progression";

/**
 * Cockpit : tout ce qu'il faut savoir d'un parcours pour s'y mettre, calculé d'un coup. Pur : la date et le suivi sont des entrées.
 * Les heures sont l'hypothèse éditoriale de content/orientation.json (heures par niveau), pas une mesure : toujours « estimation indicative ».
 */

type HeuresParNiveau = Orientation["duree_par_niveau_heures"];
export type NoeudEntree = Pick<Noeud, "id" | "titre" | "bloc" | "niveau">;
/** Le minimum d'une roadmap pour construire un programme (suffit au diagnostic, sans les prérequis). */
export type RoadmapProgramme = { id: string; blocs: string[]; noeuds: NoeudEntree[] };

export type StatutProgramme = StatutPratique | "hors-parcours";

export type NoeudProgramme = NoeudEntree & { heures: number; statut: StatutProgramme };

export type BlocProgramme = {
  bloc: string;
  noeuds: NoeudProgramme[];
  /** Compétences du parcours (hors celles que la personne a sorties). */
  actifs: number;
  acquis: number;
  /** Heures estimées des compétences du parcours. */
  heures: number;
  /** Heures estimées des compétences acquises (« à revoir » compte comme acquis, comme dans le décompte). */
  faites: number;
  restantes: number;
  /** Semaine où le bloc s'achève, au rythme donné, en enchaînant les blocs dans l'ordre ; absent si le bloc est terminé. */
  semaineFin?: number;
};

export type Programme = {
  roadmapId: string;
  blocs: BlocProgramme[];
  heures: number;
  faites: number;
  restantes: number;
  actifs: number;
  acquis: number;
};

const estFait = (s: StatutProgramme) => s === "acquis-teste" || s === "a-revoir";

/** Les blocs dans l'ordre de la roadmap, leurs compétences, leurs heures. Sans `suivi` : rien n'est commencé. Un bloc vide est omis. */
export function calculerProgramme(roadmap: RoadmapProgramme, parNiveau: HeuresParNiveau, suivi?: (id: string) => Pick<SuiviNoeud, "statut" | "horsParcours">): Programme {
  const blocs: BlocProgramme[] = roadmap.blocs.flatMap((bloc) => {
    const noeuds: NoeudProgramme[] = roadmap.noeuds
      .filter((n) => n.bloc === bloc)
      .map((n) => {
        const s = suivi?.(n.id);
        return { id: n.id, titre: n.titre, bloc: n.bloc, niveau: n.niveau, heures: heuresEstimees([n], parNiveau), statut: s?.horsParcours ? "hors-parcours" : (s?.statut ?? "a-decouvrir") };
      });
    if (noeuds.length === 0) return [];
    const actifs = noeuds.filter((n) => n.statut !== "hors-parcours");
    const heures = actifs.reduce((t, n) => t + n.heures, 0);
    const faites = actifs.filter((n) => estFait(n.statut)).reduce((t, n) => t + n.heures, 0);
    return [{ bloc, noeuds, actifs: actifs.length, acquis: actifs.filter((n) => estFait(n.statut)).length, heures, faites, restantes: heures - faites }];
  });
  const somme = (k: "heures" | "faites" | "restantes" | "actifs" | "acquis") => blocs.reduce((t, b) => t + b[k], 0);
  return { roadmapId: roadmap.id, blocs, heures: somme("heures"), faites: somme("faites"), restantes: somme("restantes"), actifs: somme("actifs"), acquis: somme("acquis") };
}

/** Numérote la semaine de fin de chaque bloc restant (cumul des heures restantes, dans l'ordre des blocs). */
export function placerSemaines(programme: Programme, rythme: number): Programme {
  let cumul = 0;
  return { ...programme, blocs: programme.blocs.map((b) => ({ ...b, semaineFin: b.restantes > 0 ? Math.ceil((cumul += b.restantes) / rythme) : undefined })) };
}

export type Projection = { semaines: number; /** « AAAA-MM-JJ » ; null s'il n'y a plus rien à faire. */ arrivee: string | null };

/** Combien de semaines au rythme choisi, et quel jour on arrive (aujourd'hui + n semaines). Zéro heure restante : rien à projeter. */
export function projeter(heuresRestantes: number, rythme: number, now: Date): Projection {
  if (heuresRestantes <= 0 || rythme <= 0) return { semaines: 0, arrivee: null };
  const semaines = Math.ceil(heuresRestantes / rythme);
  return { semaines, arrivee: ajouterJours(jourLocal(now), semaines * 7) };
}

export type ObjectifCockpit = {
  id: string;
  titre: string;
  /** Compétences encore à acquérir pour l'atteindre (lui compris, acquis et sorties exclus). */
  restantes: number;
  heures: number;
  /** Chaîne de prérequis la plus longue qui reste à parcourir en séquence. */
  etapesCritiques: number;
  chemin: { id: string; titre: string }[];
  projection: Projection;
};

export type Cockpit = {
  programme: Programme;
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
  parNiveau: HeuresParNiveau;
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

/** Assemble le cockpit d'une roadmap : programme et heures, projection, prochaine étape, révisions dues, objectif et chemin critique. */
export function calculerCockpit({ roadmap, parNiveau, rythme, now, decompte, suivi, echeances, calendrier = [], cibleId, progression }: Entree): Cockpit {
  const programme = placerSemaines(calculerProgramme(roadmap, parNiveau, suivi), rythme);
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
    const heures = heuresEstimees(aFaire, parNiveau);
    objectif = {
      id: cible.id,
      titre: cible.titre,
      restantes: aFaire.length,
      heures,
      etapesCritiques: critique.etapesRestantes,
      chemin: critique.chemin.map((id) => ({ id, titre: parId.get(id)!.titre })),
      projection: projeter(heures, rythme, now),
    };
  }

  return {
    programme,
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
