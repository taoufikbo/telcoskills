import type { Ressource } from "./schema";

export const ETAPES = ["commencer", "approfondir", "aller-plus-loin"] as const;
export const LIBELLE_ETAPE: Record<(typeof ETAPES)[number], string> = {
  commencer: "Pour commencer",
  approfondir: "Pour approfondir",
  "aller-plus-loin": "Pour aller plus loin",
};

export type GroupeRessources = { etape: (typeof ETAPES)[number] | null; libelle: string; items: Ressource[] };

/** Les ressources d'une compétence en trois groupes, dans l'ordre d'une progression ; celles sans étape (contenu ancien) restent ensemble, en dernier. */
export function grouperParEtape(ressources: Ressource[]): GroupeRessources[] {
  const groupes: GroupeRessources[] = ETAPES.map((etape) => ({ etape, libelle: LIBELLE_ETAPE[etape], items: ressources.filter((r) => r.etape === etape) }));
  const sans = ressources.filter((r) => r.etape === undefined);
  if (sans.length > 0) groupes.push({ etape: null, libelle: "Autres ressources", items: sans });
  return groupes.filter((g) => g.items.length > 0);
}
