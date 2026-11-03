import { z } from "zod";
import { PratiqueSchema } from "./pratique-schema";

export const NIVEAUX = ["fondamental", "intermediaire", "avance", "transverse"] as const;
export const DEMANDES = ["forte", "moyenne", "faible"] as const;
export const TYPES_ROADMAP = ["role", "competence"] as const;
export const TYPES_RESSOURCE = [
  "cours",
  "video",
  "opensource",
  "libre",
  "doc",
  "certif",
  "spec",
  "livre",
  "modele",
  "retour-experience",
] as const;

const slug = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "identifiant attendu en kebab-case minuscule");

export const RessourceSchema = z.object({
  type: z.enum(TYPES_RESSOURCE),
  nom: z.string().min(1),
  url: z.string().url().optional(),
  /** Conditions d'accès, pour les cursus et vidéos : « freemium » = accès libre, certificat ou suite payants. */
  acces: z.enum(["gratuit", "freemium", "payant"]).optional(),
  langue: z.enum(["fr", "en"]).optional(),
  /** Organisme, chaîne ou auteur. */
  auteur: z.string().min(1).optional(),
});

/** Origine d'une roadmap : analyse d'offres d'emploi (avec effectif et mois de collecte) ou rédaction éditoriale. */
export const ProvenanceSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("offres"),
    nombre: z.number().int().positive(),
    /** Vrai quand `nombre` est un ordre de grandeur (« environ »). */
    approximatif: z.boolean().default(false),
    /** Mois de collecte, AAAA-MM. */
    date: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  }),
  z.object({ type: z.literal("editoriale") }),
]);

export const PALIERS = [1, 2, 3, 4, 5] as const;

export const NoeudSchema = z.object({
  id: slug,
  titre: z.string().min(1),
  bloc: z.string().min(1),
  niveau: z.enum(NIVEAUX),
  prerequis: z.array(slug),
  /** Absent quand la demande n'a pas été évaluée (roadmap non issue d'offres d'emploi). */
  demande: z.enum(DEMANDES).optional(),
  resume: z.string().min(1),
  /** Palier de maîtrise à atteindre dans CE parcours (1 à 5). Absent tant que l'auteur ne l'a pas validé : le site ne déduit rien d'un palier non posé. */
  cible: z.number().int().min(1).max(5).optional(),
  ressources: z.array(RessourceSchema),
  projet: z.string().min(1).optional(),
  /** Avis d'architecte : texte écrit par l'auteur, jamais généré. Affiché sur la page du nœud. */
  avis: z.string().min(1).optional(),
  /** Fusionné depuis content/pratique/<id>.json au chargement : questions, segments, lien projet. Jamais dans les roadmaps. */
  pratique: PratiqueSchema.omit({ noeud: true }).optional(),
});

/** Trouve un cycle dans le graphe de prérequis ; renvoie le chemin (a → b → a) ou null. */
export function trouverCycle(noeuds: { id: string; prerequis: string[] }[]): string[] | null {
  const voisins = new Map(noeuds.map((n) => [n.id, n.prerequis]));
  const etat = new Map<string, 1 | 2>(); // 1 = en cours, 2 = terminé
  const pile: string[] = [];

  const visiter = (id: string): string[] | null => {
    if (etat.get(id) === 2) return null;
    if (etat.get(id) === 1) return [...pile.slice(pile.indexOf(id)), id];
    etat.set(id, 1);
    pile.push(id);
    for (const p of voisins.get(id) ?? []) {
      if (!voisins.has(p)) continue; // prérequis inconnu : signalé ailleurs
      const cycle = visiter(p);
      if (cycle) return cycle;
    }
    pile.pop();
    etat.set(id, 2);
    return null;
  };

  for (const { id } of noeuds) {
    const cycle = visiter(id);
    if (cycle) return cycle;
  }
  return null;
}

export const RoadmapSchema = z
  .object({
    id: slug,
    titre: z.string().min(1),
    type: z.enum(TYPES_ROADMAP),
    version: z.string().min(1),
    provenance: ProvenanceSchema.optional(),
    /** Phrase de présentation du public visé, affichée sur la page et lue dans la vidéo. */
    presentation: z.string().min(1).optional(),
    source: z.string().min(1),
    legende_demande: z.record(z.enum(DEMANDES), z.string()),
    blocs: z.array(z.string().min(1)).min(1),
    noeuds: z.array(NoeudSchema).min(1),
  })
  .superRefine((r, ctx) => {
    const erreur = (message: string) => ctx.addIssue({ code: "custom", message, path: ["noeuds"] });

    // 1. Identifiants uniques
    const vus = new Set<string>();
    for (const n of r.noeuds) {
      if (vus.has(n.id)) erreur(`Identifiant de nœud en double : « ${n.id} »`);
      vus.add(n.id);
    }

    // 2. Prérequis existants
    for (const n of r.noeuds) {
      for (const p of n.prerequis) {
        if (!vus.has(p)) erreur(`Le nœud « ${n.id} » référence un prérequis inexistant : « ${p} »`);
        if (p === n.id) erreur(`Le nœud « ${n.id} » est son propre prérequis`);
      }
    }

    // 3. Pas de cycle
    const cycle = trouverCycle(r.noeuds);
    if (cycle) erreur(`Cycle dans les prérequis : ${cycle.join(" → ")}`);

    // 4. Chaque nœud appartient à un bloc déclaré
    for (const n of r.noeuds) {
      if (!r.blocs.includes(n.bloc)) erreur(`Le nœud « ${n.id} » utilise un bloc non déclaré : « ${n.bloc} »`);
    }
  });

export type Provenance = z.infer<typeof ProvenanceSchema>;
export type Ressource = z.infer<typeof RessourceSchema>;
export type Noeud = z.infer<typeof NoeudSchema>;
export type Roadmap = z.infer<typeof RoadmapSchema>;
export type Niveau = (typeof NIVEAUX)[number];
export type Demande = (typeof DEMANDES)[number];
