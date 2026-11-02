import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { Roadmap } from "./schema";

const FICHIER = path.join(/*turbopackIgnore: true*/ process.cwd(), "content", "frameworks.json");

export const FrameworkSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  titre: z.string().min(1),
  sujet: z.string().min(1),
  noeuds: z.array(z.string().min(1)).min(1),
  questions: z.array(z.string().min(1)).min(1),
  /** Vrai quand le texte du framework (problème, dimensions, mode d'emploi) est rédigé : la rubrique entre alors dans la navigation. */
  redige: z.boolean().optional(),
});
export type Framework = z.infer<typeof FrameworkSchema>;

const CatalogueSchema = z.object({ _aide: z.string().optional(), frameworks: z.array(FrameworkSchema).min(1) });

export function chargerFrameworks(fichier = FICHIER): Framework[] {
  const res = CatalogueSchema.safeParse(JSON.parse(fs.readFileSync(fichier, "utf8")));
  if (!res.success) throw new Error(`Frameworks invalides :\n${res.error.issues.map((i) => `  - ${i.path.join(".")} : ${i.message}`).join("\n")}`);
  return res.data.frameworks;
}

export const getFramework = (id: string) => chargerFrameworks().find((f) => f.id === id);

/** Frameworks qui citent une compétence. */
export const frameworksDuNoeud = (noeudId: string) => chargerFrameworks().filter((f) => f.noeuds.includes(noeudId));

/** Problèmes de cohérence : identifiants en double, compétences qui n'existent dans aucune roadmap. */
export function problemesFrameworks(frameworks: Framework[], roadmaps: Roadmap[]): string[] {
  const ids = new Set(roadmaps.flatMap((r) => r.noeuds.map((n) => n.id)));
  const problemes: string[] = [];
  const vus = new Set<string>();
  for (const f of frameworks) {
    if (vus.has(f.id)) problemes.push(`Framework en double : « ${f.id} »`);
    vus.add(f.id);
    for (const n of f.noeuds) if (!ids.has(n)) problemes.push(`Le framework « ${f.id} » cite une compétence inexistante : « ${n} »`);
  }
  return problemes;
}
