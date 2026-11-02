import { INSTANCE } from "./instance";
import { LIBELLE_NIVEAU } from "./libelles";
import type { Noeud, Roadmap } from "./schema";
import { urlAbsolue } from "./site";

type Maillon = { nom: string; chemin: string };

/** Fil d'Ariane schema.org : le dernier maillon est la page courante. */
export function filAriane(maillons: Maillon[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: maillons.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: m.nom,
      item: urlAbsolue(m.chemin),
    })),
  };
}

const fournisseur = { "@type": "Organization", name: INSTANCE.nom } as const;

/** Une compétence : `chemin` est l'adresse canonique, `cheminRoadmap` celle de la roadmap qui la contient. */
export function competenceLd(noeud: Noeud, roadmap: Roadmap, chemin: string, cheminRoadmap: string) {
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: noeud.titre,
    description: noeud.resume,
    url: urlAbsolue(chemin),
    inLanguage: "fr",
    educationalLevel: LIBELLE_NIVEAU[noeud.niveau],
    learningResourceType: "compétence",
    isPartOf: { "@type": "CreativeWork", name: roadmap.titre, url: urlAbsolue(cheminRoadmap) },
    provider: fournisseur,
  };
}

/** Une roadmap : ses compétences, chacune avec son adresse. */
export function roadmapLd(roadmap: Roadmap, chemin: string, cheminNoeud: (noeudId: string) => string) {
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: roadmap.titre,
    description: roadmap.presentation ?? `Roadmap « ${roadmap.titre} » : ${roadmap.noeuds.length} compétences.`,
    url: urlAbsolue(chemin),
    inLanguage: "fr",
    learningResourceType: "roadmap",
    provider: fournisseur,
    hasPart: roadmap.noeuds.map((n) => ({ "@type": "LearningResource", name: n.titre, url: urlAbsolue(cheminNoeud(n.id)) })),
  };
}
