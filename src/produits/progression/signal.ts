import type { EtatPratique } from "./etat";

/** Vrai dès que la personne a laissé une trace : une compétence vue ou testée, ou un parcours suivi. */
export function aDeLaProgression(etat: Pick<EtatPratique, "noeuds" | "parcours">): boolean {
  return Object.keys(etat.noeuds).length > 0 || etat.parcours.length > 0;
}
