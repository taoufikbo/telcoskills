import { INSTANCE } from "./instance";

/** Adresse du dépôt quand il est public ; null sinon (aucun lien de contribution n'est alors affiché). */
export const depotPublic = (): string | null => (INSTANCE.depot?.public ? INSTANCE.depot.url : null);

/** Lien « proposer une correction » : un ticket GitHub pré-rempli pour une compétence, ou null tant que le dépôt est privé. */
export function lienCorrection(roadmapId: string, noeudId: string, titre: string): string | null {
  const depot = depotPublic();
  if (!depot) return null;
  const p = new URLSearchParams({
    title: `Compétence « ${titre} » : correction ou ressource`,
    body: `Page : /ressources/roadmaps/${roadmapId}/${noeudId}\nFichier : content/roadmaps/${roadmapId}.json (nœud « ${noeudId} »)\n\nCe que je propose :\n`,
  });
  return `${depot}/issues/new?${p.toString()}`;
}
