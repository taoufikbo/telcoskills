import fs from "node:fs";
import path from "node:path";
import { PratiqueSchema, type Pratique, type PratiqueNoeud, type Rappel } from "./pratique-schema";
import type { Roadmap } from "./schema";

const DOSSIER = path.join(/*turbopackIgnore: true*/ process.cwd(), "content", "pratique");

/**
 * Les brouillons ne sont visibles qu'en développement. Tout build de production (aperçus Vercel compris) les retire :
 * aucune question non validée ne doit atteindre un visiteur, ni dans le HTML ni dans les données envoyées au navigateur.
 */
export const brouillonsVisibles = () => process.env.NODE_ENV !== "production";

/** Lit et valide content/pratique/*.json (un fichier par compétence, nommé d'après le nœud). Vide si le dossier n'existe pas. */
export function chargerPratique(dossier = DOSSIER): Pratique[] {
  if (!fs.existsSync(dossier)) return [];
  const entrees = fs
    .readdirSync(dossier)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => {
      const res = PratiqueSchema.safeParse(JSON.parse(fs.readFileSync(path.join(dossier, f), "utf8")));
      if (!res.success) {
        const details = res.error.issues.map((i) => `  - ${i.path.join(".") || "(racine)"} : ${i.message}`).join("\n");
        throw new Error(`Pratique invalide (${f}) :\n${details}`);
      }
      if (f !== `${res.data.noeud}.json`) throw new Error(`Pratique invalide (${f}) : le fichier doit s'appeler « ${res.data.noeud}.json »`);
      return res.data;
    });
  return entrees;
}

/** Cohérence avec les roadmaps : le nœud existe ; `pourquoi` seulement sur un nœud avancé ; identifiants de questions uniques. */
export function problemesPratique(entrees: Pratique[], roadmaps: Roadmap[]): string[] {
  const noeuds = new Map(roadmaps.flatMap((r) => r.noeuds).map((n) => [n.id, n]));
  const problemes: string[] = [];
  for (const e of entrees) {
    const n = noeuds.get(e.noeud);
    if (!n) {
      problemes.push(`« ${e.noeud} » : ce nœud n'existe dans aucune roadmap`);
      continue;
    }
    if (e.pourquoi && n.niveau !== "avance") problemes.push(`« ${e.noeud} » : « pourquoi » est réservé aux nœuds avancés (niveau : ${n.niveau})`);
    const ids = [e.questionPrealable?.id, ...(e.rappel ?? []).map((q) => q.id)].filter(Boolean);
    if (new Set(ids).size !== ids.length) problemes.push(`« ${e.noeud} » : identifiants de questions en double`);
  }
  return problemes;
}

/** Retire ce qui n'est pas validé. Un contenu qu'il ne reste plus rien à montrer disparaît ; `lienProjet` n'est pas un contenu écrit, il reste. */
export function retirerBrouillons(p: PratiqueNoeud): PratiqueNoeud {
  const { questionPrealable, contenu, pourquoi, rappel, ...reste } = p;
  const rappelValide = rappel?.filter((q) => q.statut === "valide");
  const sortie: PratiqueNoeud = { ...reste };
  if (questionPrealable?.statut === "valide") sortie.questionPrealable = questionPrealable;
  if (contenu?.statut === "valide") sortie.contenu = contenu;
  if (pourquoi?.statut === "valide") sortie.pourquoi = pourquoi;
  if (rappelValide && rappelValide.length > 0) sortie.rappel = rappelValide;
  return sortie;
}

/**
 * Attache à chaque nœud (par identifiant, donc dans toutes les roadmaps qui le contiennent) son contenu de pratique.
 * Repart toujours d'un nœud sans contenu de pratique : appliquer la fusion deux fois ne laisse jamais un brouillon survivre au filtre.
 */
export function fusionnerPratique(roadmap: Roadmap, entrees: Pratique[], avecBrouillons = brouillonsVisibles()): Roadmap {
  const parNoeud = new Map(entrees.map((e) => [e.noeud, e]));
  return {
    ...roadmap,
    noeuds: roadmap.noeuds.map((noeud) => {
      const { pratique: _ancien, ...n } = noeud;
      void _ancien;
      const e = parNoeud.get(n.id);
      if (!e) return n;
      const { noeud: _id, ...contenu } = e;
      void _id;
      const visible = avecBrouillons ? contenu : retirerBrouillons(contenu);
      return Object.keys(visible).length > 0 ? { ...n, pratique: visible } : n;
    }),
  };
}

/** Tout ce que l'écran de relecture peut demander. */
export type ActionRelecture =
  | { action: "valider"; section: "questionPrealable" | "contenu" | "pourquoi" }
  | { action: "valider"; section: "rappel"; index: number }
  | { action: "rejeter"; section: "questionPrealable" | "contenu" | "pourquoi" }
  | { action: "rejeter"; section: "rappel"; index: number }
  | { action: "corriger"; section: "questionPrealable" | "contenu" | "pourquoi"; valeur: unknown }
  | { action: "corriger"; section: "rappel"; index: number; valeur: unknown };

/** Applique une décision de relecture à un contenu brut ; lève une erreur si le résultat n'est pas valide. Pure : l'écriture est faite par l'appelant. */
export function appliquerRelecture(brut: unknown, a: ActionRelecture): Pratique {
  const p: Record<string, unknown> = structuredClone(PratiqueSchema.parse(brut));

  if (a.section === "rappel") {
    const rappel = [...((p.rappel as Rappel[] | undefined) ?? [])];
    if (a.index < 0 || a.index >= rappel.length) throw new Error("Question de rappel inconnue.");
    if (a.action === "valider") rappel[a.index] = { ...rappel[a.index], statut: "valide" };
    else if (a.action === "rejeter") rappel.splice(a.index, 1);
    else rappel[a.index] = a.valeur as Rappel;
    if (rappel.length > 0) p.rappel = rappel;
    else delete p.rappel;
  } else if (a.action === "rejeter") {
    delete p[a.section];
  } else if (a.action === "valider") {
    const section = p[a.section] as { statut: string } | undefined;
    if (!section) throw new Error("Section absente.");
    section.statut = "valide";
  } else {
    p[a.section] = a.valeur;
  }
  return PratiqueSchema.parse(p);
}
