/**
 * Produit « Reprendre » : pour le visiteur qui revient, le parcours, son avancement et un seul bouton.
 * Entrées : les roadmaps allégées (src/lib/roadmapsLegeres.ts) et la configuration du diagnostic. Lit Progression et Parcours, n'écrit
 * que le choix du parcours (au clic). Se masque quand il n'y a rien à reprendre.
 */
export { default as Reprendre } from "./Reprendre";
export { calculerReprise, type Reprise, type RoadmapReprise } from "./calcul";
