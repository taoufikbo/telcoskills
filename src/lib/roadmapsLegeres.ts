import { chargerOrientation } from "./orientation";
import { chargerRoadmaps } from "./roadmaps";

/** Les roadmaps réduites à ce qu'il faut pour trouver un prochain pas côté client (pas de ressources, pas de textes longs). */
export function roadmapsLegeres() {
  const parId = new Map(chargerRoadmaps().map((r) => [r.id, r]));
  return chargerOrientation().ordre.flatMap((id) => {
    const r = parId.get(id);
    return r ? [{ id: r.id, titre: r.titre, noeuds: r.noeuds.map(({ id, titre, bloc, niveau, prerequis }) => ({ id, titre, bloc, niveau, prerequis })) }] : [];
  });
}
