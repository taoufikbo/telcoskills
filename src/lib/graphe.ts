import type { Index, TypeEntite } from "./carte";
import type { ProjetResolu } from "./projet-schema";
import { normaliser } from "@/produits/recherche";

/** Catégories de nœuds et relations du graphe du projet, sur le modèle d'une « perspective » : une vue métier d'un même graphe. */
export type TypeRelation = "PARTICIPE_A" | "DANS_LA_PHASE" | "SE_TERMINE_PAR" | "PRECEDE" | "MOBILISE";

export const LIBELLE_RELATION: Record<TypeRelation, string> = {
  PARTICIPE_A: "participe à",
  DANS_LA_PHASE: "dans la phase",
  SE_TERMINE_PAR: "se termine par",
  PRECEDE: "précède",
  MOBILISE: "mobilise",
};

export const LIBELLE_CATEGORIE: Record<TypeEntite, string> = {
  role: "Rôle",
  phase: "Phase",
  jalon: "Jalon",
  activite: "Activité",
  competence: "Compétence",
};

export type NoeudGraphe = { id: string; type: TypeEntite; ref: string; libelle: string };
export type Relation = { id: string; source: string; cible: string; type: TypeRelation };

export type Graphe = {
  noeuds: Map<string, NoeudGraphe>;
  relations: Relation[];
  /** Voisins non orientés de chaque nœud. */
  voisins: Map<string, Set<string>>;
};

export const idNoeud = (type: TypeEntite, ref: string) => `${type}:${ref}`;
export const refDe = (id: string) => id.slice(id.indexOf(":") + 1);
export const typeDe = (id: string) => id.slice(0, id.indexOf(":")) as TypeEntite;

export function construireGraphe(projet: ProjetResolu, index: Index): Graphe {
  const noeuds = new Map<string, NoeudGraphe>();
  const relations: Relation[] = [];
  const ajouter = (type: TypeEntite, ref: string, libelle: string) => noeuds.set(idNoeud(type, ref), { id: idNoeud(type, ref), type, ref, libelle });
  const relier = (source: string, cible: string, type: TypeRelation) => relations.push({ id: `${source}>${type}>${cible}`, source, cible, type });

  for (const r of projet.roles) ajouter("role", r.id, r.libelle);
  projet.phases.forEach((p, i) => {
    ajouter("phase", p.id, `${i + 1} · ${p.titre}`);
    ajouter("jalon", p.id, p.jalon.titre);
    relier(idNoeud("phase", p.id), idNoeud("jalon", p.id), "SE_TERMINE_PAR");
    if (i > 0) relier(idNoeud("phase", projet.phases[i - 1].id), idNoeud("phase", p.id), "PRECEDE");
  });
  for (const c of index.competences.values()) ajouter("competence", c.id, c.titre);
  for (const a of index.activites) {
    ajouter("activite", a.id, a.titre);
    relier(idNoeud("activite", a.id), idNoeud("phase", a.phase), "DANS_LA_PHASE");
    for (const r of a.roles) relier(idNoeud("role", r), idNoeud("activite", a.id), "PARTICIPE_A");
    for (const c of a.competences) relier(idNoeud("activite", a.id), idNoeud("competence", c), "MOBILISE");
  }

  const voisins = new Map<string, Set<string>>();
  for (const n of noeuds.keys()) voisins.set(n, new Set());
  for (const r of relations) {
    voisins.get(r.source)!.add(r.cible);
    voisins.get(r.cible)!.add(r.source);
  }
  return { noeuds, relations, voisins };
}

/** Frise du projet : toutes les phases et tous les jalons, présents dans toute perspective. */
const frise = (index: Index) => index.phases.flatMap((p) => [idNoeud("phase", p), idNoeud("jalon", p)]);

/** Scène de départ d'une perspective : la frise, et pour un rôle, ce rôle et ses activités. */
export function amorce(index: Index, roleId: string | null): string[] {
  if (!roleId) return frise(index);
  const activites = index.activites.filter((a) => a.roles.includes(roleId)).map((a) => idNoeud("activite", a.id));
  return [...frise(index), idNoeud("role", roleId), ...activites];
}

/** Voisins d'un nœud, éventuellement limités à une catégorie. */
export function developper(graphe: Graphe, id: string, categorie?: TypeEntite): string[] {
  return [...(graphe.voisins.get(id) ?? [])].filter((v) => !categorie || typeDe(v) === categorie);
}

export type EtatCompetenceGraphe = "a-faire" | "en-cours" | "maitrise" | "ignore" | "hors" | null;

export type Phrase = { id: string; libelle: string; ids: string[] };

/** « Phrases de recherche » d'une perspective : des questions prêtes à poser, qui ajoutent des nœuds à la scène. */
export function phrases(index: Index, roleId: string | null, etat: (competence: string) => EtatCompetenceGraphe): Phrase[] {
  const res: Phrase[] = [];
  const act = (a: { id: string }) => idNoeud("activite", a.id);
  const mesActivites = roleId ? index.activites.filter((a) => a.roles.includes(roleId)) : [];

  if (roleId) {
    const comps = [...new Set(mesActivites.flatMap((a) => a.competences))];
    res.push({ id: "mes-competences", libelle: "Mes compétences", ids: [...mesActivites.map(act), ...comps.map((c) => idNoeud("competence", c))] });
    const aAcquerir = comps.filter((c) => !["maitrise", "ignore"].includes(etat(c) ?? ""));
    res.push({
      id: "a-acquerir",
      libelle: "Mes compétences à acquérir",
      ids: [
        ...mesActivites.filter((a) => a.competences.some((c) => aAcquerir.includes(c))).map(act),
        ...aAcquerir.map((c) => idNoeud("competence", c)),
      ],
    });
    res.push({
      id: "avec-moi",
      libelle: "Qui travaille avec moi ?",
      ids: [...new Set(mesActivites.flatMap((a) => a.roles))].map((r) => idNoeud("role", r)),
    });
  } else {
    res.push({ id: "tous-roles", libelle: "Tous les rôles et leurs activités", ids: [...index.roles.map((r) => idNoeud("role", r)), ...index.activites.map(act)] });
  }

  index.phases.forEach((p, k) => {
    const jusque = index.activites.filter((a) => a.indexPhase <= k && (!roleId || a.roles.includes(roleId)));
    res.push({
      id: `franchir-${p}`,
      libelle: `Pour franchir le jalon ${k + 1}`,
      ids: [
        ...index.phases.slice(0, k + 1).flatMap((x) => [idNoeud("phase", x), idNoeud("jalon", x)]),
        ...jusque.map(act),
        ...(roleId ? [idNoeud("role", roleId)] : [...new Set(jusque.flatMap((a) => a.roles))].map((r) => idNoeud("role", r))),
        ...[...new Set(jusque.flatMap((a) => a.competences))].map((c) => idNoeud("competence", c)),
      ],
    });
    const dans = index.activites.filter((a) => a.indexPhase === k);
    res.push({
      id: `qui-${p}`,
      libelle: `Qui intervient en phase ${k + 1} ?`,
      ids: [idNoeud("phase", p), ...dans.map(act), ...[...new Set(dans.flatMap((a) => a.roles))].map((r) => idNoeud("role", r))],
    });
  });
  return res;
}

export type ResultatRecherche =
  | { genre: "noeud"; id: string; libelle: string; categorie: TypeEntite }
  | { genre: "phrase"; id: string; libelle: string; ids: string[] };

/** Recherche dans les nœuds du graphe et dans les phrases ; sans saisie, quelques phrases d'amorce. */
export function rechercher(graphe: Graphe, listePhrases: Phrase[], requete: string, limite = 10): ResultatRecherche[] {
  const q = normaliser(requete.trim());
  if (!q) return listePhrases.slice(0, 6).map((p) => ({ genre: "phrase", id: p.id, libelle: p.libelle, ids: p.ids }));
  const phrasesTrouvees: ResultatRecherche[] = listePhrases
    .filter((p) => normaliser(p.libelle).includes(q))
    .map((p) => ({ genre: "phrase", id: p.id, libelle: p.libelle, ids: p.ids }));
  const noeudsTrouves: ResultatRecherche[] = [...graphe.noeuds.values()]
    .filter((n) => normaliser(n.libelle).includes(q))
    .sort((a, b) => normaliser(a.libelle).indexOf(q) - normaliser(b.libelle).indexOf(q))
    .map((n) => ({ genre: "noeud", id: n.id, libelle: n.libelle, categorie: n.type }));
  return [...phrasesTrouvees, ...noeudsTrouves].slice(0, limite);
}

export type Position = { x: number; y: number };

export const DIM_GRAPHE = { colonne: 250, largeurNoeud: 210, xRoles: 0, x0: 250 } as const;

/**
 * Placement déterministe : frise des jalons en haut, phases dessous, activités empilées sous leur phase, compétences en bas dans la
 * colonne de leur première activité visible ; les rôles à gauche, à hauteur moyenne de leurs activités.
 */
export function disposerGraphe(visibles: Set<string>, index: Index): Map<string, Position> {
  const pos = new Map<string, Position>();
  const { colonne, x0, xRoles } = DIM_GRAPHE;
  const colDe = (phase: string) => x0 + index.phases.indexOf(phase) * colonne;
  const Y_JALON = 0;
  const Y_PHASE = 110;
  const Y_ACT = 250;
  const PAS_ACT = 84;

  for (const p of index.phases) {
    if (visibles.has(idNoeud("jalon", p))) pos.set(idNoeud("jalon", p), { x: colDe(p), y: Y_JALON });
    if (visibles.has(idNoeud("phase", p))) pos.set(idNoeud("phase", p), { x: colDe(p), y: Y_PHASE });
  }

  const compteur = new Map<string, number>();
  const actVisibles = index.activites.filter((a) => visibles.has(idNoeud("activite", a.id)));
  for (const a of actVisibles) {
    const i = compteur.get(a.phase) ?? 0;
    compteur.set(a.phase, i + 1);
    pos.set(idNoeud("activite", a.id), { x: colDe(a.phase), y: Y_ACT + i * PAS_ACT });
  }
  const hauteurMax = Math.max(0, ...compteur.values());
  const yComp = Y_ACT + hauteurMax * PAS_ACT + 70;

  const compParColonne = new Map<string, number>();
  for (const c of index.competences.values()) {
    const id = idNoeud("competence", c.id);
    if (!visibles.has(id)) continue;
    const premiere = actVisibles.filter((a) => a.competences.includes(c.id)).sort((a, b) => a.indexPhase - b.indexPhase)[0];
    const phase = premiere?.phase ?? index.phases[c.premierePhase];
    const i = compParColonne.get(phase) ?? 0;
    compParColonne.set(phase, i + 1);
    pos.set(id, { x: colDe(phase), y: yComp + i * 64 });
  }

  const roles = index.roles.filter((r) => visibles.has(idNoeud("role", r)));
  const souhaits = roles.map((r, i) => {
    const ys = actVisibles.filter((a) => a.roles.includes(r)).map((a) => pos.get(idNoeud("activite", a.id))!.y);
    return { r, y: ys.length ? ys.reduce((s, y) => s + y, 0) / ys.length : Y_ACT + i * 90 };
  });
  souhaits.sort((a, b) => a.y - b.y);
  let plancher = -Infinity;
  for (const s of souhaits) {
    const y = Math.max(s.y, plancher);
    pos.set(idNoeud("role", s.r), { x: xRoles, y });
    plancher = y + 90;
  }
  return pos;
}
