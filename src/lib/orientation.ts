import fs from "node:fs";
import path from "node:path";
import { OrientationSchema, problemesOrientation, type Orientation } from "./orientation-schema";
import { chargerProjets } from "./projets";
import { chargerRoadmaps } from "./roadmaps";
import type { Roadmap } from "./schema";

const FICHIER = path.join(/*turbopackIgnore: true*/ process.cwd(), "content", "orientation.json");

/** Valide une configuration brute ; lève une erreur lisible. */
export function validerOrientation(brut: unknown, roadmaps: Roadmap[], projets: string[], roles: string[] = []): Orientation {
  const res = OrientationSchema.safeParse(brut);
  if (!res.success) {
    const details = res.error.issues.map((i) => `  - ${i.path.join(".") || "(racine)"} : ${i.message}`).join("\n");
    throw new Error(`Orientation invalide :\n${details}`);
  }
  const problemes = problemesOrientation(res.data, roadmaps, projets, roles);
  if (problemes.length > 0) throw new Error(`Orientation invalide :\n${problemes.map((p) => `  - ${p}`).join("\n")}`);
  return res.data;
}

/** Charge et valide content/orientation.json. Appelé au build : toute erreur le fait échouer. */
export function chargerOrientation(): Orientation {
  const projets = chargerProjets();
  return validerOrientation(JSON.parse(fs.readFileSync(FICHIER, "utf8")), chargerRoadmaps(), projets.map((p) => p.id), projets.flatMap((p) => p.roles.map((r) => r.id)));
}
