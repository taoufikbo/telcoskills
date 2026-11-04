import { z } from "zod";

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "identifiant attendu en kebab-case minuscule");
const texte = z.string().min(1);

/** « brouillon » : écrit par l'assistant, jamais publié ; « valide » : relu et approuvé par l'auteur. */
export const STATUTS_CONTENU = ["brouillon", "valide"] as const;
export const StatutContenuSchema = z.enum(STATUTS_CONTENU);
export type StatutContenu = z.infer<typeof StatutContenuSchema>;

const options = z
  .array(texte)
  .length(4, "un QCM a exactement 4 propositions")
  .refine((o) => new Set(o).size === o.length, "les propositions doivent être distinctes");

/** QCM : une bonne réponse, une explication, et la ressource du nœud d'où la réponse est tirée. */
export const QuestionSchema = z.object({
  id: slug,
  enonce: texte,
  options,
  bonne: z.number().int().min(0).max(3),
  explication: texte,
  /** Ressource sur laquelle repose la réponse. Écrit sans l'avoir lue en ligne : à vérifier à la relecture. */
  source: texte,
  statut: StatutContenuSchema,
});

/** Question de rappel : en plus, l'indice de la proposition fausse la plus plausible (celle qu'on croit vraie par erreur). */
export const RappelSchema = QuestionSchema.extend({ mauvaisChoixPlausible: z.number().int().min(0).max(3) }).refine((q) => q.mauvaisChoixPlausible !== q.bonne, {
  message: "le mauvais choix plausible ne peut pas être la bonne réponse",
  path: ["mauvaisChoixPlausible"],
});

/** Petit schéma boîtes et flèches, rendu à côté du segment qui l'illustre ; `alt` le décrit pour les lecteurs d'écran. */
export const SchemaSegmentSchema = z
  .object({
    alt: texte,
    boites: z.array(texte).min(2).max(6),
    fleches: z.array(z.tuple([z.number().int().min(0), z.number().int().min(0)])),
  })
  .refine((s) => s.fleches.every(([a, b]) => a < s.boites.length && b < s.boites.length && a !== b), { message: "une flèche désigne deux boîtes existantes et distinctes", path: ["fleches"] });

/** Un segment d'explication : 4 éléments au plus (charge cognitive). */
export const SegmentSchema = z.object({
  titre: texte,
  elements: z.array(texte).min(1).max(4, "un segment contient 4 éléments au plus"),
  schema: SchemaSegmentSchema.optional(),
});

const PALIERS_VALIDATION = ["1", "2", "3", "4", "5"] as const;

/**
 * Fiche pédagogique d'une compétence (docs/SPEC-FICHE-COMPETENCE.md, EX-01 à EX-06). Écrite par l'assistant : `brouillon` jusqu'à l'audit de l'auteur.
 * `validation` est cumulative par palier : les critères du palier N supposent ceux des paliers inférieurs ; la page n'en montre que jusqu'au palier visé du parcours.
 */
export const FicheSchema = z.object({
  statut: StatutContenuSchema,
  /** « Vous saurez… » : 3 à 7 phrases commençant par un verbe d'action. */
  objectifs: z.array(texte).min(3, "3 objectifs au moins").max(7, "7 objectifs au plus"),
  /** Notions à maîtriser, courtes, cochables par la personne (auto-évaluation : ne compte ni dans le palier atteint ni dans « acquis (testé) »). 30 au plus pour tenir dans le masque d'état. */
  notions: z.array(texte).min(3, "3 notions au moins").max(8, "8 notions au plus"),
  /** Un contexte et des étapes numérotées, dans un environnement télécom. */
  situation: z.object({ contexte: texte, etapes: z.array(texte).min(3, "3 étapes au moins").max(7, "7 étapes au plus") }).optional(),
  /** Ce qu'on sait faire à chaque palier (cumulatif). Seuls les paliers utiles à au moins un rôle sont renseignés. */
  validation: z.partialRecord(z.enum(PALIERS_VALIDATION), z.array(texte).min(1).max(4)).optional(),
  /** Compétences critiques (palier visé 4 ou 5 dans au moins un rôle) : un exercice pratique ou un mini-laboratoire. */
  exercice: z.object({ consigne: texte, livrable: texte }).optional(),
});

export const PratiqueSchema = z.object({
  /** Identifiant du nœud : une compétence partagée entre roadmaps n'a qu'un seul contenu. */
  noeud: slug,
  questionPrealable: QuestionSchema.optional(),
  fiche: FicheSchema.optional(),
  contenu: z
    .object({
      statut: StatutContenuSchema,
      vocabulaire: z.array(z.object({ terme: texte, definition: texte })),
      segments: z.array(SegmentSchema).min(1),
    })
    .optional(),
  /** Où la compétence sert dans le projet fil rouge (exemple résolu). Doit désigner une activité réelle du projet. */
  lienProjet: z.object({ phase: slug, role: slug }).optional(),
  /** Nœuds avancés seulement : « Pourquoi ce choix plutôt que X ? ». */
  pourquoi: z.object({ question: texte, reference: texte, source: texte, statut: StatutContenuSchema }).optional(),
  /** 2 ou 3 QCM par compétence. Le schéma tolère 1 pour qu'un rejet à la relecture ne casse pas le build ; la règle « 2 ou 3 » est vérifiée par les tests sur le contenu livré. */
  rappel: z.array(RappelSchema).min(1).max(3, "3 questions de rappel au plus").optional(),
});

export type Fiche = z.infer<typeof FicheSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type Rappel = z.infer<typeof RappelSchema>;
export type Segment = z.infer<typeof SegmentSchema>;
export type Pratique = z.infer<typeof PratiqueSchema>;
/** Ce qu'un nœud porte une fois fusionné (l'identifiant du nœud est déjà dans le nœud). */
export type PratiqueNoeud = Omit<Pratique, "noeud">;
