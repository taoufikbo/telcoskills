import { z } from "zod";
import type { Roadmap } from "./schema";

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "identifiant attendu en kebab-case minuscule");
const texte = z.string().min(1);

export const NIVEAUX_TELECOM = ["aucune", "notions", "aise"] as const;
export type NiveauTelecom = (typeof NIVEAUX_TELECOM)[number];

export const OptionSchema = z.object({
  id: slug,
  libelle: texte,
  /** Points donnés à chaque roadmap (par identifiant) quand on choisit cette option. */
  poids: z.record(slug, z.number().int().min(0)),
  /** Phrase affichée pour justifier la recommandation quand cette option a pesé dans le choix. */
  raison: texte,
  /** Projet fil rouge à proposer en plus, le cas échéant. */
  projet: slug.optional(),
  /** Rôle du projet fil rouge que cette réponse désigne ; mène à sa page quand il n'a pas de roadmap. */
  role: slug.optional(),
});

export const QuestionSchema = z.object({
  id: z.enum(["metier", "telecom", "objectif"]),
  question: texte,
  aide: texte.optional(),
  options: z.array(OptionSchema).min(2),
});

export const OrientationSchema = z.object({
  /** Ordre d'affichage des parcours, du plus accessible au plus spécialisé. */
  ordre: z.array(slug).min(1),
  questions: z.array(QuestionSchema).length(3),
  /** Premier nœud conseillé, par parcours et par niveau en télécom. */
  /** Heures d'étude supposées par compétence, selon son niveau : hypothèse éditoriale, jamais une mesure. */
  duree_par_niveau_heures: z.object({ fondamental: z.number().positive(), intermediaire: z.number().positive(), avance: z.number().positive(), transverse: z.number().positive() }),
  /** Investissement (1 léger, 2 moyen, 3 long) selon le niveau de difficulté et le palier visé : échelle ordinale, hypothèse éditoriale, sans durée en heures. */
  investissement_par_palier: z.record(z.enum(["fondamental", "intermediaire", "avance", "transverse"]), z.record(z.enum(["1", "2", "3", "4", "5"]), z.number().int().min(1).max(3))).optional(),
  premiers_noeuds: z.record(slug, z.object({ aucune: slug, notions: slug, aise: slug })),
});

export type Orientation = z.infer<typeof OrientationSchema>;
export type Reponses = { metier: string; telecom: string; objectif: string };
export type Recommandation = {
  roadmapId: string;
  noeudId: string;
  raisons: string[];
  /** Autres parcours à considérer, du plus proche au moins proche. */
  alternatives: string[];
  projet?: string;
  /** Rôle du projet désigné par la réponse « métier », le cas échéant. */
  role?: string;
};

/** Incohérences entre la configuration et le contenu : parcours, nœuds et projets cités doivent exister. */
export function problemesOrientation(config: Orientation, roadmaps: Roadmap[], projets: string[], roles: string[] = []): string[] {
  const problemes: string[] = [];
  const parId = new Map(roadmaps.map((r) => [r.id, r]));

  const telecom = config.questions.find((q) => q.id === "telecom");
  const idsTelecom = telecom?.options.map((o) => o.id).sort().join(",");
  if (idsTelecom !== [...NIVEAUX_TELECOM].sort().join(",")) problemes.push(`La question « telecom » doit proposer exactement les options : ${NIVEAUX_TELECOM.join(", ")}`);

  for (const id of config.ordre) if (!parId.has(id)) problemes.push(`ordre : roadmap inconnue « ${id} »`);
  for (const r of roadmaps) {
    if (!config.ordre.includes(r.id)) problemes.push(`ordre : la roadmap « ${r.id} » n'est pas listée`);
    const depart = config.premiers_noeuds[r.id];
    if (!depart) problemes.push(`premiers_noeuds : aucun départ pour « ${r.id} »`);
    else
      for (const niveau of NIVEAUX_TELECOM)
        if (!r.noeuds.some((n) => n.id === depart[niveau])) problemes.push(`premiers_noeuds : « ${depart[niveau]} » n'existe pas dans « ${r.id} » (niveau ${niveau})`);
  }
  for (const id of Object.keys(config.premiers_noeuds)) if (!parId.has(id)) problemes.push(`premiers_noeuds : roadmap inconnue « ${id} »`);

  for (const q of config.questions)
    for (const o of q.options) {
      for (const id of Object.keys(o.poids)) if (!parId.has(id)) problemes.push(`${q.id}/${o.id} : poids pour une roadmap inconnue « ${id} »`);
      if (o.projet && !projets.includes(o.projet)) problemes.push(`${q.id}/${o.id} : projet inconnu « ${o.projet} »`);
      if (o.role && roles.length > 0 && !roles.includes(o.role)) problemes.push(`${q.id}/${o.id} : rôle inconnu « ${o.role} »`);
    }
  return problemes;
}

/** Classement des parcours d'après les réponses déjà données (somme des poids, ex æquo départagés par l'ordre d'affichage). */
export function classerParcours(config: Orientation, reponses: Partial<Reponses>): string[] {
  const score = new Map<string, number>(config.ordre.map((id) => [id, 0]));
  for (const q of config.questions) {
    const option = q.options.find((o) => o.id === reponses[q.id]);
    if (option) for (const [id, p] of Object.entries(option.poids)) score.set(id, (score.get(id) ?? 0) + p);
  }
  return [...score.keys()].sort((a, b) => score.get(b)! - score.get(a)! || config.ordre.indexOf(a) - config.ordre.indexOf(b));
}

/** Recommande un parcours (somme des poids des trois réponses, ex æquo départagés par l'ordre d'affichage) et un premier nœud. */
export function recommander(config: Orientation, reponses: Reponses): Recommandation {
  const choisies = config.questions.map((q) => ({ question: q.id, option: q.options.find((o) => o.id === reponses[q.id]) }));
  const classement = classerParcours(config, reponses);
  const roadmapId = classement[0];
  const niveau = (NIVEAUX_TELECOM as readonly string[]).includes(reponses.telecom) ? (reponses.telecom as NiveauTelecom) : "aucune";

  return {
    roadmapId,
    noeudId: config.premiers_noeuds[roadmapId][niveau],
    raisons: choisies.filter((c) => c.option && (c.option.poids[roadmapId] ?? 0) > 0).map((c) => c.option!.raison),
    alternatives: classement.slice(1, 3),
    projet: choisies.map((c) => c.option?.projet).find((p) => p),
    role: choisies.map((c) => c.option?.role).find((r) => r),
  };
}

/** Vrai si chaque réponse correspond à une option existante. */
export function reponsesValides(config: Orientation, r: Partial<Reponses> | null): r is Reponses {
  return !!r && config.questions.every((q) => q.options.some((o) => o.id === r[q.id]));
}

/** Prochaine question à poser d'après les réponses déjà données, dans l'ordre de la configuration ; undefined quand tout est répondu. */
export function prochaineQuestion(config: Orientation, reponses: Partial<Reponses>) {
  return config.questions.find((q) => !q.options.some((o) => o.id === reponses[q.id]));
}
