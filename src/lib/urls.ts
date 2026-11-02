import { INSTANCE } from "./instance";

/**
 * Adresses des pages, selon l'instance : site historique (/<roadmap>, /projets/…) ou nouvelle arborescence (/ressources/…).
 * Toute page qui fabrique un lien vers une roadmap, un nœud ou le projet passe par ici.
 */
export const BASE_ROADMAPS = "/ressources/roadmaps";
export const BASE_PROJET = "/ressources/projet-fil-rouge";

export const urlRoadmap = (roadmapId: string) => (INSTANCE.refonte ? `${BASE_ROADMAPS}/${roadmapId}` : `/${roadmapId}`);

/** Un nœud : page à part dans la nouvelle arborescence, tiroir de la roadmap (?noeud=) dans l'ancienne. */
export const urlNoeud = (roadmapId: string, noeudId: string) =>
  INSTANCE.refonte ? `${BASE_ROADMAPS}/${roadmapId}/${noeudId}` : `/${roadmapId}?noeud=${noeudId}`;

/** Le projet fil rouge (un seul projet dans la nouvelle arborescence) et sa carte interactive. */
export const urlProjet = (projetId: string, carte = false) =>
  INSTANCE.refonte ? `${BASE_PROJET}${carte ? "/carte" : ""}` : `/projets/${projetId}${carte ? "/carte" : ""}`;

/** Page d'un rôle du projet fil rouge qui n'a pas de roadmap. */
export const urlRole = (roleId: string) => `/roles/${roleId}`;

/** Page propre d'une compétence (HTML complet, indexable). Sur l'ancien site elle est distincte du tiroir `?noeud=` de la roadmap. */
export const urlPageNoeud = (roadmapId: string, noeudId: string) => (INSTANCE.refonte ? urlNoeud(roadmapId, noeudId) : `/${roadmapId}/${noeudId}`);
