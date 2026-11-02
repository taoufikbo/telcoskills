/**
 * État du visiteur, calculé (jamais stocké) à partir des traces laissées dans ce navigateur :
 * - « inconnu » tant que le stockage n'est pas lu (rendu serveur, première hydratation) ;
 * - « revenant » s'il a de la progression ou des réponses au diagnostic enregistrées ;
 * - « nouveau » sinon.
 * Aucun compte, aucun cookie : un autre navigateur est un nouveau visiteur.
 */
export type EtatVisiteur = "inconnu" | "nouveau" | "revenant";

export type Signaux = { pret: boolean; progression: boolean; parcours: boolean };

export function calculerVisiteur({ pret, progression, parcours }: Signaux): EtatVisiteur {
  if (!pret) return "inconnu";
  return progression || parcours ? "revenant" : "nouveau";
}
