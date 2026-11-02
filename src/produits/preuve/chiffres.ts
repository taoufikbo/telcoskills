/** Un chiffre affiché comme preuve : toujours accompagné de sa source (spécification : pas d'affirmation sans chiffre ni source). */
export type Chiffre = { valeur: number; libelle: string; source: string };

type Catalogue = {
  roadmaps: { type?: string; noeuds: { id: string; ressources: { url?: string | null }[] }[] }[];
  projets: { phases: unknown[] }[];
};

const SOURCE_CATALOGUE = "décompte du catalogue publié (content/roadmaps)";

/**
 * Les chiffres du catalogue, calculés au build : jamais saisis à la main. Une compétence partagée entre roadmaps compte une fois,
 * une ressource citée plusieurs fois aussi. Un chiffre nul est retiré (un bloc sans donnée se masque).
 */
export function chiffresCatalogue({ roadmaps, projets }: Catalogue): Chiffre[] {
  const competences = new Set(roadmaps.flatMap((r) => r.noeuds.map((n) => n.id))).size;
  const liens = new Set(roadmaps.flatMap((r) => r.noeuds.flatMap((n) => n.ressources.map((x) => x.url).filter((u): u is string => !!u)))).size;
  const projet = projets[0];
  const tous: Chiffre[] = [
    // Les parcours thématiques (type « competence », comme Sylva) ne sont pas des métiers.
    { valeur: roadmaps.filter((r) => (r.type ?? "role") === "role").length, libelle: "parcours par métier", source: SOURCE_CATALOGUE },
    { valeur: competences, libelle: "compétences cartographiées", source: SOURCE_CATALOGUE },
    { valeur: liens, libelle: "ressources avec lien", source: SOURCE_CATALOGUE },
    { valeur: projet?.phases.length ?? 0, libelle: "phases du projet fil rouge", source: "décompte du projet publié (content/projets)" },
  ];
  return tous.filter((c) => c.valeur > 0);
}
