import { choisirCible, disposerCarte, type Disposition } from "@/produits/carte-heros";
import { chargerOrientation } from "./orientation";
import { chargerRoadmaps } from "./roadmaps";

/** Carte d'un point de départ possible du diagnostic : de ce départ jusqu'à la compétence la plus avancée qui s'appuie dessus. */
export type CarteDepart = { roadmapId: string; titreRoadmap: string; depart: string; disposition: Disposition };

/**
 * Une carte par point de départ du diagnostic (« roadmap/nœud », voir premiers_noeuds de content/orientation.json),
 * calculée au build, avec les heures estimées (même hypothèse éditoriale que le diagnostic).
 */
export function cartesDesDeparts(): Record<string, CarteDepart> {
  const config = chargerOrientation();
  const parId = new Map(chargerRoadmaps().map((r) => [r.id, r]));
  const cartes: Record<string, CarteDepart> = {};
  for (const [roadmapId, departs] of Object.entries(config.premiers_noeuds)) {
    const r = parId.get(roadmapId);
    if (!r) continue;
    const niveaux = new Map(r.noeuds.map((n) => [n.id, n.niveau]));
    for (const depart of new Set(Object.values(departs))) {
      const disposition = disposerCarte(r, [choisirCible(r, depart)], { depart, heures: (id) => config.duree_par_niveau_heures[niveaux.get(id)!] });
      cartes[`${roadmapId}/${depart}`] = { roadmapId, titreRoadmap: r.titre, depart, disposition };
    }
  }
  return cartes;
}
