"use client";

import { useCallback, useMemo } from "react";
import {
  compter,
  definirHorsParcours,
  effacerDeclarations,
  marquerVu,
  reinitialiserRoadmap,
  reprendreProgression,
  retirerVu,
  suivreParcours,
  suiviNoeud,
  vueProgression,
  type SuiviNoeud,
} from "./etat";
import type { Progression, Statut } from "./progression";
import type { Roadmap } from "@/lib/schema";
import { usePratique } from "./usePratique";

/** Ce qu'une personne peut déclarer : « maîtrisé » n'en fait pas partie, on ne l'obtient que par un rappel réussi. */
export type StatutDeclarable = Exclude<Statut, "maitrise">;

/**
 * Progression d'une roadmap, calculée depuis l'état de pratique partagé (une compétence = un état, dans toutes les roadmaps).
 * `progression` est une vue à 4 statuts pour les graphes, la liste et le mode objectif ; « maitrise » y signifie « acquis (testé) ».
 */
export function useProgression(roadmap: Roadmap) {
  const { etat, now, muter, enregistrerRappel, marquerMigrationLue } = usePratique();

  const progression = useMemo(() => vueProgression(etat, roadmap, now), [etat, roadmap, now]);
  const decompte = useMemo(() => compter(etat, roadmap.id, roadmap.noeuds, now), [etat, roadmap, now]);
  const suivi = useCallback((id: string): SuiviNoeud => suiviNoeud(etat, roadmap.id, id, now), [etat, roadmap.id, now]);

  const definirStatut = useCallback(
    (id: string, statut: StatutDeclarable) =>
      muter((e, n) => {
        const sortie = suivreParcours(definirHorsParcours(e, roadmap.id, id, statut === "ignore"), roadmap.id);
        if (statut === "en-cours") return marquerVu(sortie, id, n);
        if (statut === "a-faire") return retirerVu(sortie, id);
        return sortie;
      }),
    [muter, roadmap.id],
  );

  /** Import d'un fichier ou d'un lien : remplace les déclarations, jamais une compétence déjà acquise par un test. */
  const remplacer = useCallback(
    (prog: Progression) => muter((e, n) => reprendreProgression(effacerDeclarations(e, roadmap), roadmap.id, prog, n)),
    [muter, roadmap],
  );

  /** Choisir ce parcours comme « mon parcours » (bouton explicite). */
  const suivreCeParcours = useCallback(() => muter((e) => suivreParcours(e, roadmap.id)), [muter, roadmap.id]);
  const monParcours = etat.parcours[0] === roadmap.id;

  const reinitialiser = useCallback(() => muter((e) => reinitialiserRoadmap(e, roadmap)), [muter, roadmap]);

  const migration = { declares: etat.declares, aAfficher: etat.migre && etat.declares > 0 && !etat.messageMigrationVu };

  return { progression, decompte, suivi, monParcours, suivreCeParcours, definirStatut, remplacer, reinitialiser, enregistrerRappel, migration, marquerMigrationLue };
}
