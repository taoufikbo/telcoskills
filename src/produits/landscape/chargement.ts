import fs from "node:fs";
import path from "node:path";
import { LandscapeSchema, problemesLandscape, type Landscape } from "./schema";
import { chargerProjets } from "@/lib/projets";
import { chargerRoadmaps } from "@/lib/roadmaps";

const FICHIER = path.join(/*turbopackIgnore: true*/ process.cwd(), "content", "landscape.json");

/** Valide un landscape brut (schéma, puis cohérence avec le projet et les roadmaps) ; lève une erreur lisible. */
export function validerLandscape(brut: unknown, source = "landscape"): Landscape {
  const res = LandscapeSchema.safeParse(brut);
  if (!res.success) {
    const details = res.error.issues.map((i) => `  - ${i.path.join(".") || "(racine)"} : ${i.message}`).join("\n");
    throw new Error(`Landscape invalide (${source}) :\n${details}`);
  }
  const projet = chargerProjets()[0];
  const problemes = projet ? problemesLandscape(res.data, projet, chargerRoadmaps()) : [];
  if (problemes.length > 0) throw new Error(`Landscape invalide (${source}) :\n${problemes.map((p) => `  - ${p}`).join("\n")}`);
  return res.data;
}

/** Charge et valide content/landscape.json. Appelé au build : toute erreur le fait échouer. */
export function chargerLandscape(fichier = FICHIER): Landscape {
  return validerLandscape(JSON.parse(fs.readFileSync(fichier, "utf8")), path.basename(fichier));
}

export type LienCompetence = { roadmap: string; noeud: string; titre: string };
export type OutilResolu = Omit<Landscape["outils"][number], "noeuds"> & {
  competences: LienCompetence[];
  /** Adresse du logo (public/logos/<id>.svg, voir scripts/generer-logos.mjs) ; absente quand l'outil n'en a pas. */
  logo?: string;
};
export type LandscapeResolu = Omit<Landscape, "outils"> & {
  outils: OutilResolu[];
  /** Rôles qui touchent au moins un outil, dans l'ordre du projet. */
  roles: { id: string; libelle: string; roadmap?: string }[];
};

/**
 * Remplace chaque id de compétence par un lien vers une roadmap. Les ids de nœud sont partagés entre parcours :
 * on garde la roadmap du premier rôle de l'outil qui en a une et qui contient le nœud, sinon la première qui le contient.
 */
export function resoudreLandscape(l: Landscape): LandscapeResolu {
  const roadmaps = chargerRoadmaps();
  const projet = chargerProjets()[0];
  const roleRoadmap = new Map((projet?.roles ?? []).map((r) => [r.id, r.roadmap]));
  const lien = (noeud: string, roles: string[]): LienCompetence => {
    const preferees = roles.map((r) => roleRoadmap.get(r)).filter((id): id is string => !!id);
    const contient = (id: string) => roadmaps.find((x) => x.id === id && x.noeuds.some((n) => n.id === noeud));
    const r = preferees.map(contient).find(Boolean) ?? roadmaps.find((x) => x.noeuds.some((n) => n.id === noeud))!;
    return { roadmap: r.id, noeud, titre: r.noeuds.find((n) => n.id === noeud)!.titre };
  };
  const utilises = new Set(l.outils.flatMap((o) => o.roles));
  return {
    ...l,
    outils: l.outils.map(({ noeuds, ...o }) => ({
      ...o,
      competences: noeuds.map((n) => lien(n, o.roles)),
      logo: fs.existsSync(path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "logos", `${o.id}.svg`)) ? `/logos/${o.id}.svg` : undefined,
    })),
    roles: (projet?.roles ?? []).filter((r) => utilises.has(r.id)).map(({ id, libelle, roadmap }) => ({ id, libelle, roadmap })),
  };
}
