/**
 * Textes de l'accueil qui relèvent de l'auteur : positionnement, thèse, offre d'entrée.
 * Première rédaction (cadrage « convergence des mondes cloud et télécom », offre « montée en compétence d'une équipe ») :
 * à relire et à corriger par l'auteur. Un seul endroit à modifier.
 */
export const TEXTES_ACCUEIL = {
  /** Sous le titre : le problème, en une phrase. */
  positionnement:
    "Les métiers du cloud et ceux du télécom travaillent désormais sur les mêmes plateformes. TelcoSkills cartographie, pour chaque métier, les compétences à acquérir et leur ordre, du premier pas à la mise en production.",
  /** Sous le visuel de la convergence : l'idée directrice. */
  these:
    "Un cœur 5G tourne aujourd'hui sur une plateforme Kubernetes. L'ingénieur cloud doit comprendre le télécom, l'ingénieur télécom doit comprendre le cloud. Aucun des deux ne part de zéro, mais chacun a besoin d'un ordre différent : c'est cet ordre que ce site rend visible.",
  offre: {
    titre: "Faire monter une équipe en compétence",
    corps:
      "Pour une équipe plateforme, exploitation ou intégration qui reçoit les compétences de l'autre monde : le cloud pour les équipes télécom, le télécom pour les équipes cloud. On part des métiers de l'équipe, on prend les parcours de ce site et on les ajuste à votre plateforme.",
    suite: "Un premier échange cadre la situation ; le format et la durée se décident ensuite avec vous.",
  },
} as const;
