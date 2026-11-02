import fs from "node:fs";
import path from "node:path";
import { ProjetSchema, problemesProjet, type Projet, type ProjetResolu } from "./projet-schema";
import { chargerRoadmaps } from "./roadmaps";
import type { Ressource, Roadmap } from "./schema";

const DOSSIER = path.join(/*turbopackIgnore: true*/ process.cwd(), "content", "projets");

/** Valide un projet brut (schéma, puis cohérence avec les roadmaps) ; lève une erreur lisible. */
export function validerProjet(brut: unknown, roadmaps: Roadmap[], source = "projet"): Projet {
  const res = ProjetSchema.safeParse(brut);
  if (!res.success) {
    const details = res.error.issues.map((i) => `  - ${i.path.join(".") || "(racine)"} : ${i.message}`).join("\n");
    throw new Error(`Projet invalide (${source}) :\n${details}`);
  }
  const problemes = problemesProjet(res.data, roadmaps);
  if (problemes.length > 0) throw new Error(`Projet invalide (${source}) :\n${problemes.map((p) => `  - ${p}`).join("\n")}`);
  return res.data;
}

/** Charge et valide tous les projets de content/projets. Appelé au build : toute erreur le fait échouer. */
export function chargerProjets(dossier = DOSSIER): Projet[] {
  if (!fs.existsSync(dossier)) return [];
  const roadmaps = chargerRoadmaps();
  const projets = fs
    .readdirSync(dossier)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => validerProjet(JSON.parse(fs.readFileSync(path.join(dossier, f), "utf8")), roadmaps, f));
  const ids = new Set<string>();
  for (const p of projets) {
    if (ids.has(p.id)) throw new Error(`Identifiant de projet en double : « ${p.id} »`);
    ids.add(p.id);
  }
  return projets;
}

export function getProjet(slug: string): Projet | undefined {
  return chargerProjets().find((p) => p.id === slug);
}

/** Remplace chaque renvoi par le titre et le niveau du nœud, et fournit les roadmaps des rôles (pour la progression). */
export function resoudreProjet(projet: Projet): { projet: ProjetResolu; roadmapsDesRoles: Record<string, Roadmap> } {
  const roadmaps = new Map(chargerRoadmaps().map((r) => [r.id, r]));
  const resolu: ProjetResolu = {
    ...projet,
    phases: projet.phases.map((phase) => ({
      ...phase,
      activites: phase.activites.map((a) => ({
        ...a,
        competences: a.competences.map((c) => {
          const r = roadmaps.get(c.roadmap)!;
          const n = r.noeuds.find((x) => x.id === c.noeud)!;
          return { ...c, titre: n.titre, niveau: n.niveau, bloc: n.bloc, roadmapTitre: r.titre };
        }),
      })),
    })),
  };
  const roadmapsDesRoles: Record<string, Roadmap> = {};
  for (const role of projet.roles) if (role.roadmap) roadmapsDesRoles[role.roadmap] = roadmaps.get(role.roadmap)!;
  return { projet: resolu, roadmapsDesRoles };
}

export type RessourceApprentissage = Pick<Ressource, "nom" | "url" | "type" | "acces" | "langue" | "auteur">;

/** Pour chaque compétence du projet : jusqu'à 4 cursus, playlists ou documents (gratuits d'abord, français avant anglais). */
export function apprentissagePourProjet(projet: ProjetResolu): Record<string, RessourceApprentissage[]> {
  const noeuds = new Map(chargerRoadmaps().flatMap((r) => r.noeuds).map((n) => [n.id, n]));
  const sortie: Record<string, RessourceApprentissage[]> = {};
  for (const phase of projet.phases)
    for (const a of phase.activites)
      for (const c of a.competences) {
        if (sortie[c.noeud]) continue;
        sortie[c.noeud] = (noeuds.get(c.noeud)?.ressources ?? [])
          .filter((r) => r.url && r.acces && ["cours", "video", "doc"].includes(r.type))
          .slice(0, 4)
          .map(({ nom, url, type, acces, langue, auteur }) => ({ nom, url, type, acces, langue, auteur }));
      }
  return sortie;
}
