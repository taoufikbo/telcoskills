import { z } from "zod";
import type { Niveau, Roadmap } from "./schema";

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "identifiant attendu en kebab-case minuscule");
const texte = z.string().min(1);

/** Renvoi vers un nœud d'une roadmap. */
export const CompetenceRefSchema = z.object({ roadmap: slug, noeud: slug });

export const RoleProjetSchema = z.object({
  id: slug,
  libelle: texte,
  description: texte,
  /** Roadmap du rôle, si elle existe ; absent pour les rôles sans parcours (chef de projet, éditeur…). */
  roadmap: slug.optional(),
});

export const ActiviteSchema = z.object({
  titre: texte,
  roles: z.array(slug).min(1),
  competences: z.array(CompetenceRefSchema),
});

export const PhaseSchema = z.object({
  id: slug,
  titre: texte,
  objectif: texte,
  livrables: z.array(texte).min(1),
  activites: z.array(ActiviteSchema).min(1),
  jalon: z.object({ titre: texte, criteres: z.array(texte).min(1) }),
  risques: z.array(texte),
});

export const ProjetSchema = z.object({
  id: slug,
  titre: texte,
  version: texte,
  resume: texte,
  contexte: texte,
  source: texte,
  roles: z.array(RoleProjetSchema).min(1),
  phases: z.array(PhaseSchema).min(1),
});

export type CompetenceRef = z.infer<typeof CompetenceRefSchema>;
export type RoleProjet = z.infer<typeof RoleProjetSchema>;
export type Activite = z.infer<typeof ActiviteSchema>;
export type Phase = z.infer<typeof PhaseSchema>;
export type Projet = z.infer<typeof ProjetSchema>;

/** Compétence dont le nœud a été retrouvé dans sa roadmap. */
export type CompetenceResolue = CompetenceRef & { titre: string; niveau: Niveau; bloc: string; roadmapTitre: string };
export type ActiviteResolue = Omit<Activite, "competences"> & { competences: CompetenceResolue[] };
export type PhaseResolue = Omit<Phase, "activites"> & { activites: ActiviteResolue[] };
export type ProjetResolu = Omit<Projet, "phases"> & { phases: PhaseResolue[] };

/** Contrôles de cohérence entre un projet et les roadmaps ; renvoie la liste des problèmes. */
export function problemesProjet(projet: Projet, roadmaps: Roadmap[]): string[] {
  const problemes: string[] = [];
  const parId = new Map(roadmaps.map((r) => [r.id, r]));

  const unique = (ids: string[], quoi: string) => {
    const vus = new Set<string>();
    for (const id of ids) {
      if (vus.has(id)) problemes.push(`${quoi} en double : « ${id} »`);
      vus.add(id);
    }
  };
  unique(projet.roles.map((r) => r.id), "Rôle");
  unique(projet.phases.map((p) => p.id), "Phase");

  const roles = new Set(projet.roles.map((r) => r.id));
  for (const role of projet.roles)
    if (role.roadmap && !parId.has(role.roadmap)) problemes.push(`Le rôle « ${role.id} » référence une roadmap inexistante : « ${role.roadmap} »`);

  const rolesActifs = new Set<string>();
  for (const phase of projet.phases)
    for (const activite of phase.activites) {
      for (const role of activite.roles) {
        if (!roles.has(role)) problemes.push(`Phase « ${phase.id} », activité « ${activite.titre} » : rôle inconnu « ${role} »`);
        rolesActifs.add(role);
      }
      for (const c of activite.competences) {
        const r = parId.get(c.roadmap);
        if (!r) problemes.push(`Phase « ${phase.id} », activité « ${activite.titre} » : roadmap inconnue « ${c.roadmap} »`);
        else if (!r.noeuds.some((n) => n.id === c.noeud)) problemes.push(`Phase « ${phase.id} », activité « ${activite.titre} » : le nœud « ${c.noeud} » n'existe pas dans « ${c.roadmap} »`);
      }
    }
  // Exemple résolu : le lienProjet d'une compétence doit désigner une activité réelle du projet qui la mobilise, pour ce rôle.
  for (const r of roadmaps)
    for (const n of r.noeuds) {
      const lien = n.pratique?.lienProjet;
      if (!lien) continue;
      const phase = projet.phases.find((p) => p.id === lien.phase);
      if (!phase) problemes.push(`Compétence « ${n.id} » : lienProjet désigne une phase inconnue « ${lien.phase} »`);
      else if (!phase.activites.some((a) => a.roles.includes(lien.role) && a.competences.some((c) => c.noeud === n.id)))
        problemes.push(`Compétence « ${n.id} » : aucune activité de la phase « ${lien.phase} » ne la mobilise pour le rôle « ${lien.role} »`);
    }
  for (const role of roles) if (!rolesActifs.has(role)) problemes.push(`Le rôle « ${role} » n'intervient dans aucune activité`);
  return problemes;
}
