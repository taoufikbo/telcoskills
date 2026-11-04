import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { RessourceSchema, type Roadmap } from "./schema";

const FICHIER = path.join(/*turbopackIgnore: true*/ process.cwd(), "content", "ressources", "apprentissage.json");

/** Une ressource d'apprentissage rattachée à un ou plusieurs nœuds (par identifiant de nœud). */
export const EntreeApprentissageSchema = RessourceSchema.extend({
  noeuds: z.array(z.string().min(1)).min(1),
  /** Roadmaps où cette ressource ne doit pas apparaître (par exemple une formation propre à une distribution, hors d'un parcours qui en utilise une autre). */
  sauf: z.array(z.string().min(1)).optional(),
  type: z.enum(["cours", "video", "doc"]),
  url: z.string().url().startsWith("https://"),
  acces: z.enum(["gratuit", "freemium", "payant"]),
  langue: z.enum(["fr", "en"]),
  auteur: z.string().min(1),
});

export const CatalogueSchema = z.object({
  _aide: z.string().optional(),
  ressources: z.array(EntreeApprentissageSchema),
});

export type EntreeApprentissage = z.infer<typeof EntreeApprentissageSchema>;

/** Lit et valide le catalogue ; vide s'il n'existe pas. */
export function chargerApprentissage(fichier = FICHIER): EntreeApprentissage[] {
  if (!fs.existsSync(fichier)) return [];
  const res = CatalogueSchema.safeParse(JSON.parse(fs.readFileSync(fichier, "utf8")));
  if (!res.success) {
    const details = res.error.issues.map((i) => `  - ${i.path.join(".")} : ${i.message}`).join("\n");
    throw new Error(`Catalogue d'apprentissage invalide :\n${details}`);
  }
  return res.data.ressources;
}

/** Problèmes de cohérence : nœud inexistant dans toutes les roadmaps, doublon de lien pour un même nœud. */
export function problemesApprentissage(entrees: EntreeApprentissage[], roadmaps: Roadmap[]): string[] {
  const ids = new Set(roadmaps.flatMap((r) => r.noeuds.map((n) => n.id)));
  const problemes: string[] = [];
  const vus = new Set<string>();
  for (const e of entrees)
    for (const n of e.noeuds) {
      if (!ids.has(n)) problemes.push(`« ${e.nom} » : le nœud « ${n} » n'existe dans aucune roadmap`);
      const cle = `${n}|${e.url}`;
      if (vus.has(cle)) problemes.push(`« ${e.nom} » : lien en double pour le nœud « ${n} »`);
      vus.add(cle);
    }
  return problemes;
}

const RANG_ACCES = { gratuit: 0, freemium: 1, payant: 2 } as const;
const RANG_LANGUE = { fr: 0, en: 1 } as const;

/** Ajoute à chaque nœud les ressources d'apprentissage qui le concernent : gratuites d'abord, puis en français. */
export function fusionnerApprentissage(roadmap: Roadmap, entrees: EntreeApprentissage[]): Roadmap {
  return {
    ...roadmap,
    noeuds: roadmap.noeuds.map((n) => {
      const ajouts = entrees
        .filter((e) => e.noeuds.includes(n.id) && !e.sauf?.includes(roadmap.id))
        .sort((a, b) => RANG_ACCES[a.acces] - RANG_ACCES[b.acces] || RANG_LANGUE[a.langue] - RANG_LANGUE[b.langue])
        .map(({ noeuds: _noeuds, sauf: _sauf, ...ressource }) => ressource);
      return ajouts.length === 0 ? n : { ...n, ressources: [...n.ressources, ...ajouts] };
    }),
  };
}
