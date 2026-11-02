/**
 * Parcours thématiques (roadmaps de type « competence ») : chacun vit dans son propre onglet, à part des parcours métier.
 * Ils n'apparaissent ni dans le catalogue des roadmaps, ni dans les décomptes « par métier », ni dans le diagnostic.
 */
export const RUBRIQUES_THEMATIQUES: Record<string, { nom: string; href: string }> = {
  "parcours-sylva": { nom: "Parcours Sylva", href: "/sylva" },
};

/** Rubrique d'un parcours thématique, ou null pour un parcours métier. */
export const rubriqueThematique = (roadmapId: string) => RUBRIQUES_THEMATIQUES[roadmapId] ?? null;

/** Les parcours métier, seuls à figurer dans le catalogue et les décomptes « par métier ». */
export const parcoursMetier = <R extends { type: string }>(roadmaps: R[]) => roadmaps.filter((r) => r.type === "role");
