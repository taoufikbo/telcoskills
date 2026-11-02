import { z } from "zod";
import type { Projet } from "@/lib/projet-schema";
import type { Roadmap } from "@/lib/schema";

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "identifiant attendu en kebab-case minuscule");
const texte = z.string().min(1);

/** Statut de l'outil dans la CNCF ; absent quand il n'est pas un projet CNCF ou que le statut n'a pas été relevé. */
export const STATUTS_CNCF = ["graduated", "incubating", "sandbox"] as const;

export const SousCategorieSchema = z.object({ id: slug, libelle: texte });

/** Une section du landscape : on regroupe par fonction (comme landscape.cncf.io), pas par couche de modèle OSI. */
export const CategorieSchema = z.object({
  id: slug,
  libelle: texte,
  /** Une phrase : à quoi sert cette section dans une pile télécom. Lue dans le parcours guidé. */
  intro: texte,
  sous_categories: z.array(SousCategorieSchema).min(1),
});

export const OutilSchema = z.object({
  id: slug,
  nom: texte,
  categorie: slug,
  sous_categorie: slug,
  url: z.string().url(),
  cncf: z.enum(STATUTS_CNCF).optional(),
  /** Rôles du projet fil rouge qui manipulent l'outil. */
  roles: z.array(slug).min(1),
  /** Compétences (ids de nœuds) qui l'enseignent : fait le lien avec les roadmaps. */
  noeuds: z.array(slug),
});

export const LandscapeSchema = z.object({
  version: texte,
  source: texte,
  categories: z.array(CategorieSchema).min(1),
  outils: z.array(OutilSchema).min(1),
});

export type SousCategorie = z.infer<typeof SousCategorieSchema>;
export type Categorie = z.infer<typeof CategorieSchema>;
export type Outil = z.infer<typeof OutilSchema>;
export type Landscape = z.infer<typeof LandscapeSchema>;

/** Nombre de rôles de la sélection qui manipulent l'outil (0 : hors pile). Sélection vide : tout le monde compte. */
export function usageParRoles(outil: { roles: string[] }, selection: string[]): number {
  return selection.length === 0 ? outil.roles.length : outil.roles.filter((r) => selection.includes(r)).length;
}

/** Contrôles de cohérence avec le projet (rôles) et les roadmaps (compétences) ; renvoie la liste des problèmes. */
export function problemesLandscape(l: Landscape, projet: Projet, roadmaps: Roadmap[]): string[] {
  const problemes: string[] = [];
  const unique = (ids: string[], quoi: string) => {
    const vus = new Set<string>();
    for (const id of ids) {
      if (vus.has(id)) problemes.push(`${quoi} en double : « ${id} »`);
      vus.add(id);
    }
  };
  unique(l.categories.map((c) => c.id), "Catégorie");
  unique(l.outils.map((o) => o.id), "Outil");
  for (const c of l.categories) unique(c.sous_categories.map((s) => s.id), `Sous-catégorie de « ${c.id} »`);

  const categories = new Map(l.categories.map((c) => [c.id, c]));
  const roles = new Set(projet.roles.map((r) => r.id));
  const noeuds = new Set(roadmaps.flatMap((r) => r.noeuds.map((n) => n.id)));

  for (const o of l.outils) {
    const c = categories.get(o.categorie);
    if (!c) problemes.push(`Outil « ${o.id} » : catégorie inconnue « ${o.categorie} »`);
    else if (!c.sous_categories.some((s) => s.id === o.sous_categorie))
      problemes.push(`Outil « ${o.id} » : sous-catégorie « ${o.sous_categorie} » absente de « ${o.categorie} »`);
    for (const r of o.roles) if (!roles.has(r)) problemes.push(`Outil « ${o.id} » : rôle inconnu « ${r} »`);
    for (const n of o.noeuds) if (!noeuds.has(n)) problemes.push(`Outil « ${o.id} » : compétence inconnue « ${n} »`);
  }
  for (const c of l.categories)
    for (const s of c.sous_categories)
      if (!l.outils.some((o) => o.categorie === c.id && o.sous_categorie === s.id))
        problemes.push(`Sous-catégorie « ${c.id}/${s.id} » sans outil`);
  return problemes;
}
