import fs from "node:fs";
import path from "node:path";
import { chargerApprentissage, fusionnerApprentissage, problemesApprentissage } from "./apprentissage";
import { INSTANCE } from "./instance";
import { chargerPratique, fusionnerPratique, problemesPratique } from "./pratique";
import { RoadmapSchema, type Roadmap } from "./schema";

const DOSSIER = path.join(/*turbopackIgnore: true*/ process.cwd(), "content", "roadmaps");

/** Valide un objet brut ; lève une erreur lisible listant tous les problèmes. */
export function validerRoadmap(brut: unknown, source = "roadmap"): Roadmap {
  const res = RoadmapSchema.safeParse(brut);
  if (!res.success) {
    const details = res.error.issues
      .map((i) => `  - ${i.path.join(".") || "(racine)"} : ${i.message}`)
      .join("\n");
    throw new Error(`Roadmap invalide (${source}) :\n${details}`);
  }
  return res.data;
}

/** Charge et valide tous les JSON de content/roadmaps. Appelé au build : toute erreur le fait échouer. */
export function chargerRoadmaps(dossier = DOSSIER): Roadmap[] {
  const fichiers = fs.readdirSync(dossier).filter((f) => f.endsWith(".json")).sort();
  const roadmaps = fichiers.map((f) =>
    validerRoadmap(JSON.parse(fs.readFileSync(path.join(dossier, f), "utf8")), f),
  );

  const ids = new Set<string>();
  for (const r of roadmaps) {
    if (ids.has(r.id)) throw new Error(`Identifiant de roadmap en double : « ${r.id} »`);
    ids.add(r.id);
  }
  const apprentissage = chargerApprentissage();
  const problemes = problemesApprentissage(apprentissage, roadmaps);
  if (problemes.length > 0) throw new Error(`Catalogue d'apprentissage incohérent :\n${problemes.map((p) => "  - " + p).join("\n")}`);
  const pratique = chargerPratique();
  const problemesP = problemesPratique(pratique, roadmaps);
  if (problemesP.length > 0) throw new Error(`Contenu de pratique incohérent :\n${problemesP.map((p) => "  - " + p).join("\n")}`);
  const fusionnees = roadmaps.map((r) => fusionnerPratique(fusionnerApprentissage(r, apprentissage), pratique));
  return INSTANCE.refonte ? fusionnees.map(masquerRessourcesSansLien) : fusionnees;
}

/** Une ressource sans lien ne se publie pas : sur l'instance publique elle est masquée (liste dans reports/content-audit.md). */
export function masquerRessourcesSansLien(r: Roadmap): Roadmap {
  return { ...r, noeuds: r.noeuds.map((n) => ({ ...n, ressources: n.ressources.filter((x) => x.url) })) };
}

export function getRoadmap(slug: string): Roadmap | undefined {
  return chargerRoadmaps().find((r) => r.id === slug);
}
