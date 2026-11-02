import { recommander, reponsesValides, type Orientation } from "@/lib/orientation-schema";
import { prochaineEtape, type RoadmapLegere } from "@/lib/objectif";
import { compter, vueProgression, type Decompte, type EtatPratique } from "@/produits/progression";

/** Ce que Reprendre sait d'une roadmap : de quoi trouver le prochain pas et nommer le parcours. */
export type RoadmapReprise = RoadmapLegere & { titre: string };

export type Reprise = {
  roadmapId: string;
  titreRoadmap: string;
  /** « parcours » : le parcours suivi ; « diagnostic » : rien n'est encore suivi, c'est le parcours recommandé. */
  origine: "parcours" | "diagnostic";
  /** La compétence à ouvrir ; absente quand tout le parcours est acquis ou ignoré. */
  noeud: { id: string; titre: string } | null;
  decompte: Decompte;
};

type Entree = {
  etat: EtatPratique;
  reponses: { metier: string; telecom: string; objectif: string } | null;
  config: Orientation;
  roadmaps: RoadmapReprise[];
  now: Date;
};

/**
 * Où reprendre : dans le dernier parcours suivi, la compétence en cours ou la prochaine disponible ;
 * sinon, le premier pas du parcours recommandé par le diagnostic. Null s'il n'y a rien à reprendre. Pur.
 */
export function calculerReprise({ etat, reponses, config, roadmaps, now }: Entree): Reprise | null {
  const parId = new Map(roadmaps.map((r) => [r.id, r]));
  const suivi = etat.parcours.map((id) => parId.get(id)).find((r) => r !== undefined);
  if (suivi) {
    const suite = prochaineEtape(suivi, vueProgression(etat, suivi, now));
    return {
      roadmapId: suivi.id,
      titreRoadmap: suivi.titre,
      origine: "parcours",
      noeud: suite.noeud ? { id: suite.noeud.id, titre: suite.noeud.titre } : null,
      decompte: compter(etat, suivi.id, suivi.noeuds, now),
    };
  }
  if (!reponsesValides(config, reponses)) return null;
  const reco = recommander(config, reponses);
  const r = parId.get(reco.roadmapId);
  const noeud = r?.noeuds.find((n) => n.id === reco.noeudId);
  if (!r || !noeud) return null;
  return { roadmapId: r.id, titreRoadmap: r.titre, origine: "diagnostic", noeud: { id: noeud.id, titre: noeud.titre }, decompte: compter(etat, r.id, r.noeuds, now) };
}
