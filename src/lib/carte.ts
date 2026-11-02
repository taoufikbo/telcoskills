import type { ProjetResolu } from "./projet-schema";
import type { Niveau } from "./schema";

export type TypeEntite = "role" | "phase" | "jalon" | "competence" | "activite";
export type Selection = { type: TypeEntite; id: string } | null;

export type ActiviteIndexee = {
  id: string;
  phase: string;
  indexPhase: number;
  titre: string;
  roles: string[];
  competences: string[];
};

export type CompetenceIndexee = {
  id: string;
  titre: string;
  niveau: Niveau;
  bloc: string;
  roadmap: string;
  /** Indice (à partir de 0) de la première phase où elle est mobilisée. */
  premierePhase: number;
};

export type Index = {
  phases: string[];
  roles: string[];
  activites: ActiviteIndexee[];
  competences: Map<string, CompetenceIndexee>;
};

/** Ensembles d'entités liées à une sélection (pour éclairer les unes et estomper les autres). */
export type Liens = {
  roles: Set<string>;
  phases: Set<string>;
  jalons: Set<string>;
  competences: Set<string>;
  activites: Set<string>;
};

export function indexer(projet: ProjetResolu): Index {
  const activites: ActiviteIndexee[] = [];
  const competences = new Map<string, CompetenceIndexee>();
  projet.phases.forEach((phase, indexPhase) =>
    phase.activites.forEach((a, i) => {
      activites.push({
        id: `${phase.id}:${i}`,
        phase: phase.id,
        indexPhase,
        titre: a.titre,
        roles: a.roles,
        competences: a.competences.map((c) => c.noeud),
      });
      for (const c of a.competences)
        if (!competences.has(c.noeud))
          competences.set(c.noeud, { id: c.noeud, titre: c.titre, niveau: c.niveau, bloc: c.bloc, roadmap: c.roadmap, premierePhase: indexPhase });
    }),
  );
  return { phases: projet.phases.map((p) => p.id), roles: projet.roles.map((r) => r.id), activites, competences };
}

const vide = (): Liens => ({ roles: new Set(), phases: new Set(), jalons: new Set(), competences: new Set(), activites: new Set() });

/** À partir d'un jeu d'activités, tout ce qui s'y rattache. */
function depuisActivites(index: Index, activites: ActiviteIndexee[]): Liens {
  const l = vide();
  for (const a of activites) {
    l.activites.add(a.id);
    l.phases.add(a.phase);
    l.jalons.add(a.phase);
    for (const r of a.roles) l.roles.add(r);
    for (const c of a.competences) l.competences.add(c);
  }
  return l;
}

/**
 * Entités liées à une sélection.
 * - rôle : ses activités, et par elles phases, jalons, compétences ;
 * - phase : ses activités (rôles, compétences) et son jalon ;
 * - jalon : tout ce qu'il faut avoir fait pour le franchir, c'est-à-dire les activités de cette phase et des précédentes ;
 * - compétence : les activités qui la mobilisent, donc phases, jalons et rôles ;
 * - activité : sa phase, ses rôles et ses compétences.
 * Renvoie null sans sélection (rien à estomper).
 */
export function liensDe(index: Index, sel: Selection): Liens | null {
  if (!sel) return null;
  switch (sel.type) {
    case "role":
      return depuisActivites(index, index.activites.filter((a) => a.roles.includes(sel.id)));
    case "phase":
      return depuisActivites(index, index.activites.filter((a) => a.phase === sel.id));
    case "jalon": {
      const k = index.phases.indexOf(sel.id);
      return depuisActivites(index, index.activites.filter((a) => a.indexPhase <= k));
    }
    case "competence":
      return depuisActivites(index, index.activites.filter((a) => a.competences.includes(sel.id)));
    case "activite":
      return depuisActivites(index, index.activites.filter((a) => a.id === sel.id));
  }
}

const TYPES: TypeEntite[] = ["role", "phase", "jalon", "competence", "activite"];

export function parserSelection(valeur: string | null): Selection {
  if (!valeur) return null;
  const i = valeur.indexOf(":");
  const type = valeur.slice(0, i) as TypeEntite;
  const id = valeur.slice(i + 1);
  return i > 0 && TYPES.includes(type) && id ? { type, id } : null;
}

export function formaterSelection(sel: Selection): string | null {
  return sel ? `${sel.type}:${sel.id}` : null;
}

/** Nombre d'activités de chaque rôle dans chaque phase (liens du diagramme de flux, colonne 1 → 2). */
export function fluxRolesPhases(index: Index): { role: string; phase: string; valeur: number }[] {
  const m = new Map<string, number>();
  for (const a of index.activites) for (const r of a.roles) m.set(`${r}|${a.phase}`, (m.get(`${r}|${a.phase}`) ?? 0) + 1);
  return [...m].map(([k, valeur]) => {
    const [role, phase] = k.split("|");
    return { role, phase, valeur };
  });
}

/** Nombre de compétences distinctes d'un domaine mobilisées dans chaque phase (colonne 2 → 3). */
export function fluxPhasesBlocs(index: Index): { phase: string; bloc: string; valeur: number }[] {
  const parPhase = new Map<string, Set<string>>();
  for (const a of index.activites) {
    const s = parPhase.get(a.phase) ?? new Set<string>();
    for (const c of a.competences) s.add(c);
    parPhase.set(a.phase, s);
  }
  const m = new Map<string, number>();
  for (const [phase, comps] of parPhase) for (const c of comps) {
    const bloc = index.competences.get(c)!.bloc;
    m.set(`${phase}|${bloc}`, (m.get(`${phase}|${bloc}`) ?? 0) + 1);
  }
  return [...m].map(([k, valeur]) => {
    const i = k.indexOf("|");
    return { phase: k.slice(0, i), bloc: k.slice(i + 1), valeur };
  });
}

/** Compétences regroupées par domaine, dans l'ordre de première apparition dans le projet. */
export function competencesParBloc(index: Index): { bloc: string; competences: CompetenceIndexee[] }[] {
  const groupes = new Map<string, CompetenceIndexee[]>();
  for (const c of [...index.competences.values()].sort((a, b) => a.premierePhase - b.premierePhase)) {
    groupes.set(c.bloc, [...(groupes.get(c.bloc) ?? []), c]);
  }
  return [...groupes].map(([bloc, competences]) => ({ bloc, competences }));
}
