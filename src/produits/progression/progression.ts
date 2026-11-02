import { z } from "zod";
import type { Noeud, Roadmap } from "@/lib/schema";

export const STATUTS = ["a-faire", "en-cours", "maitrise", "ignore"] as const;
export type Statut = (typeof STATUTS)[number];

/** Seuls les statuts différents de « à faire » sont stockés. */
export type Progression = Record<string, Statut>;

const FichierSchema = z.object({
  roadmap: z.string().optional(),
  statuts: z.record(z.string(), z.enum(STATUTS)),
});

export const cleStockage = (roadmapId: string) => `tcr:progression:${roadmapId}`;

export function statutDe(prog: Progression, id: string): Statut {
  return prog[id] ?? "a-faire";
}

/** Statuts d'un stockage brut, sans filtrer par roadmap (utilisé par la migration). Illisible : vide. */
export function lireStatuts(brut: string | null): Progression {
  if (!brut) return {};
  try {
    const res = FichierSchema.safeParse(JSON.parse(brut));
    return res.success ? Object.fromEntries(Object.entries(res.data.statuts).filter(([, s]) => s !== "a-faire")) : {};
  } catch {
    return {};
  }
}

function nettoyer(statuts: Progression, roadmap: { noeuds: { id: string }[] }): Progression {
  const ids = new Set(roadmap.noeuds.map((n) => n.id));
  return Object.fromEntries(Object.entries(statuts).filter(([id, s]) => ids.has(id) && s !== "a-faire"));
}

/** Lecture tolérante du localStorage : toute donnée illisible est ignorée. */
export function lireProgression(brut: string | null, roadmap: Roadmap): Progression {
  if (!brut) return {};
  try {
    const res = FichierSchema.safeParse(JSON.parse(brut));
    return res.success ? nettoyer(res.data.statuts, roadmap) : {};
  } catch {
    return {};
  }
}

export function serialiser(roadmap: Roadmap, prog: Progression): string {
  return JSON.stringify({ roadmap: roadmap.id, statuts: prog });
}

export function exporterProgression(roadmap: Roadmap, prog: Progression): string {
  return JSON.stringify(
    { roadmap: roadmap.id, version: roadmap.version, exporteLe: new Date().toISOString(), statuts: prog },
    null,
    2,
  );
}

/** Valide un fichier importé ; lève une Error au message affichable. */
export function importerProgression(texte: string, roadmap: Roadmap): Progression {
  let json: unknown;
  try {
    json = JSON.parse(texte);
  } catch {
    throw new Error("Ce fichier n'est pas un JSON valide.");
  }
  const res = FichierSchema.safeParse(json);
  if (!res.success) throw new Error("Format de progression non reconnu.");
  if (res.data.roadmap && res.data.roadmap !== roadmap.id)
    throw new Error(`Ce fichier concerne la roadmap « ${res.data.roadmap} », pas « ${roadmap.id} ».`);
  return nettoyer(res.data.statuts, roadmap);
}

const LETTRE_STATUT: Record<Exclude<Statut, "a-faire">, string> = { "en-cours": "e", maitrise: "m", ignore: "i" };
const STATUT_DE_LETTRE: Record<string, Statut> = { e: "en-cours", m: "maitrise", i: "ignore" };

/**
 * Sauvegarde sans compte : la progression d'une roadmap tient dans un paramètre d'adresse (`?etat=`), copiable et collable.
 * Format : « <roadmap>~<nœud>.<m|e|i>~<nœud>.<m|e|i>… » (m maîtrisé, e en cours, i ignoré), tous caractères sûrs dans une URL.
 */
export function encoderEtat(roadmap: { id: string; noeuds: { id: string }[] }, prog: Progression): string {
  const entrees = Object.entries(nettoyer(prog, roadmap)).map(([id, s]) => `${id}.${LETTRE_STATUT[s as Exclude<Statut, "a-faire">]}`);
  return [roadmap.id, ...entrees].join("~");
}

/** Décode un état partagé ; lève une Error au message affichable si le lien n'est pas celui de cette roadmap. */
export function decoderEtat(texte: string, roadmap: Roadmap): Progression {
  const [id, ...entrees] = texte.split("~");
  if (id !== roadmap.id) throw new Error(`Ce lien concerne la roadmap « ${id} », pas « ${roadmap.id} ».`);
  const statuts: Progression = {};
  for (const e of entrees) {
    const [noeud, lettre] = e.split(".");
    const statut = STATUT_DE_LETTRE[lettre];
    if (!noeud || !statut) throw new Error("Lien de sauvegarde illisible.");
    statuts[noeud] = statut;
  }
  return nettoyer(statuts, roadmap);
}

export type Stats = { total: number; maitrise: number; actifs: number; pourcentage: number };

/** Le pourcentage compte les nœuds maîtrisés parmi ceux qui ne sont pas ignorés. */
export function statistiques(noeuds: Noeud[], prog: Progression): Stats {
  const ignores = noeuds.filter((n) => statutDe(prog, n.id) === "ignore").length;
  const maitrise = noeuds.filter((n) => statutDe(prog, n.id) === "maitrise").length;
  const actifs = noeuds.length - ignores;
  return { total: noeuds.length, maitrise, actifs, pourcentage: actifs === 0 ? 0 : Math.round((maitrise / actifs) * 100) };
}

export function statistiquesParBloc(roadmap: Roadmap, prog: Progression): { bloc: string; stats: Stats }[] {
  return roadmap.blocs.map((bloc) => ({
    bloc,
    stats: statistiques(roadmap.noeuds.filter((n) => n.bloc === bloc), prog),
  }));
}
