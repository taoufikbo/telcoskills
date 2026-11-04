import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { Roadmap } from "./schema";

export const MONDES = ["cloud", "convergence", "telecom", "transverse"] as const;
export type Monde = (typeof MONDES)[number];

const MondesSchema = z.object({
  cloud: z.array(z.string()),
  convergence: z.array(z.string()),
  telecom: z.array(z.string()),
  transverse: z.array(z.string()),
});
export type Mondes = z.infer<typeof MondesSchema>;

const FICHIER = path.join(/*turbopackIgnore: true*/ process.cwd(), "content", "mondes.json");

/** Charge content/mondes.json (le champ « _note » est ignoré). */
export function chargerMondes(): Mondes {
  return MondesSchema.parse(JSON.parse(fs.readFileSync(FICHIER, "utf8")));
}

/** Monde d'un bloc ; undefined si le bloc n'est classé nulle part. */
export function mondeDuBloc(mondes: Mondes, bloc: string): Monde | undefined {
  return MONDES.find((m) => mondes[m].includes(bloc));
}

/** Blocs des roadmaps qui ne sont dans aucun monde, ou dans plusieurs : le contenu et le classement doivent rester d'accord. */
export function problemesMondes(mondes: Mondes, roadmaps: Roadmap[]): string[] {
  const problemes: string[] = [];
  for (const r of roadmaps) for (const b of new Set(r.noeuds.map((n) => n.bloc))) if (!mondeDuBloc(mondes, b)) problemes.push(`${r.id} : le bloc « ${b} » n'est classé dans aucun monde`);
  const vus = new Map<string, Monde>();
  for (const m of MONDES) for (const b of mondes[m]) {
    if (vus.has(b)) problemes.push(`le bloc « ${b} » est classé à la fois dans « ${vus.get(b)} » et « ${m} »`);
    vus.set(b, m);
  }
  return problemes;
}

export type Repartition = Record<Monde, number>;

/** Nombre de compétences de la roadmap dans chaque monde. */
export function repartition(roadmap: Roadmap, mondes: Mondes): Repartition {
  const r: Repartition = { cloud: 0, convergence: 0, telecom: 0, transverse: 0 };
  for (const n of roadmap.noeuds) r[mondeDuBloc(mondes, n.bloc) ?? "transverse"]++;
  return r;
}

/** Part du cloud parmi les compétences qui relèvent d'un monde (hors transverses) : sert à ordonner les métiers du cloud vers le télécom. */
export function partCloud(r: Repartition): number {
  const total = r.cloud + r.convergence + r.telecom;
  return total === 0 ? 0 : r.cloud / total;
}
