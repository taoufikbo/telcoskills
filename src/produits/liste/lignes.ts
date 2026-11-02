import type { Noeud } from "@/lib/schema";
import { statutDe, type Progression, type Statut } from "@/produits/progression";

/** Le minimum d'une roadmap dont la liste a besoin. */
export type RoadmapListe = { blocs: string[]; noeuds: Pick<Noeud, "id" | "titre" | "bloc" | "niveau" | "demande">[] };

export type Ligne = RoadmapListe["noeuds"][number] & {
  statut: Statut;
  /** Sur le chemin conseillé (mode objectif) ; toujours faux sans chemin. */
  surChemin: boolean;
  /** Hors du chemin conseillé : affichée en retrait. */
  attenuee: boolean;
};

/** Compétences regroupées par bloc, dans l'ordre de la roadmap, avec leur statut et leur place sur le chemin. Pure. */
export function lignesParBloc(roadmap: RoadmapListe, progression: Progression, chemin: Set<string> | null): { bloc: string; lignes: Ligne[] }[] {
  return roadmap.blocs.map((bloc) => ({
    bloc,
    lignes: roadmap.noeuds
      .filter((n) => n.bloc === bloc)
      .map((n) => ({ ...n, statut: statutDe(progression, n.id), surChemin: !!chemin?.has(n.id), attenuee: !!chemin && !chemin.has(n.id) })),
  }));
}
