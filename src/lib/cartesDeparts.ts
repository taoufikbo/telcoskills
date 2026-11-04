import { choisirCible, disposerCarte, type Disposition } from "@/produits/carte-heros";
import { chargerOrientation } from "./orientation";
import { investissementDe } from "./palier";
import { chargerRoadmaps } from "./roadmaps";

/** Carte d'un point de départ possible du diagnostic : de ce départ jusqu'à la compétence la plus avancée qui s'appuie dessus. */
export type CarteDepart = { roadmapId: string; titreRoadmap: string; depart: string; disposition: Disposition };

/**
 * Une carte par point de départ du diagnostic (« roadmap/nœud », voir premiers_noeuds de content/orientation.json),
 * calculée au build, avec l'investissement léger, moyen ou long de chaque compétence à son palier visé (même table que le diagnostic).
 */
export function cartesDesDeparts(): Record<string, CarteDepart> {
  const config = chargerOrientation();
  const parId = new Map(chargerRoadmaps().map((r) => [r.id, r]));
  const cartes: Record<string, CarteDepart> = {};
  for (const [roadmapId, departs] of Object.entries(config.premiers_noeuds)) {
    const r = parId.get(roadmapId);
    if (!r) continue;
    for (const depart of new Set(Object.values(departs))) {
      const disposition = disposerCarte(r, [choisirCible(r, depart)], { depart, investissement: investissementDe(r, config.investissement_par_palier) });
      cartes[`${roadmapId}/${depart}`] = { roadmapId, titreRoadmap: r.titre, depart, disposition };
    }
  }
  return cartes;
}
