/** Compétences « de jugement » (arbitrages d'architecte) : leur page appelle un avis de l'auteur. */
export const NOEUDS_DE_JUGEMENT = ["dimensionnement", "matrice-exigences", "ha-geo", "evaluation-fournisseurs", "cout-energie", "cycle-vie-plateforme"] as const;
export const estNoeudDeJugement = (id: string) => (NOEUDS_DE_JUGEMENT as readonly string[]).includes(id);
