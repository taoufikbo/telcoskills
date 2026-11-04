import { calculerProgramme, type DonneesProgramme } from "@/produits/cockpit";
import { chargerOrientation } from "./orientation";
import { chargerRoadmaps } from "./roadmaps";

/** Le programme de chaque parcours que le diagnostic peut recommander (rien n'est commencé : blocs, compétences, palier visé, investissement). Calculé au build. */
export function programmesDesParcours(): Record<string, DonneesProgramme & { titre: string }> {
  const config = chargerOrientation();
  const parId = new Map(chargerRoadmaps().map((r) => [r.id, r]));
  return Object.fromEntries(
    Object.keys(config.premiers_noeuds).flatMap((id) => {
      const r = parId.get(id);
      return r ? [[id, { titre: r.titre, ...calculerProgramme(r, config.investissement_par_palier) }] as const] : [];
    }),
  );
}
