import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { chargerProjets } from "./projets";
import type { Projet } from "./projet-schema";

const FICHIER = path.join(/*turbopackIgnore: true*/ process.cwd(), "content", "chaine-projet.json");

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "identifiant attendu en kebab-case minuscule");
const texte = z.string().min(1);

export const ICONES = ["cible", "plan", "serveur", "reseau", "cluster", "puce", "bouclier", "paquets", "test", "courbe"] as const;

export const EtapeSchema = z.object({
  id: slug,
  titre: texte,
  /** Libellé d'une ou deux mots, sous l'icône. */
  court: texte,
  icone: z.enum(ICONES),
  /** Phases du projet fil rouge couvertes par cette étape. */
  phases: z.array(slug).min(1),
  sortie: texte,
  outils: z.array(texte).min(1),
  /** Ce que fait chaque rôle à cette étape (clé = id de rôle du projet). */
  actions: z.record(slug, texte),
});

export const ChaineSchema = z.object({ projet: slug, etapes: z.array(EtapeSchema).min(2) });

export type Etape = z.infer<typeof EtapeSchema>;
export type Chaine = z.infer<typeof ChaineSchema>;

/** Valide une chaîne brute contre le projet auquel elle se rattache ; lève une erreur lisible. */
export function validerChaine(brut: unknown, projets: Projet[]): Chaine {
  const res = ChaineSchema.safeParse(brut);
  if (!res.success) {
    const details = res.error.issues.map((i) => `  - ${i.path.join(".") || "(racine)"} : ${i.message}`).join("\n");
    throw new Error(`Chaîne du projet invalide :\n${details}`);
  }
  const chaine = res.data;
  const projet = projets.find((p) => p.id === chaine.projet);
  if (!projet) throw new Error(`Chaîne du projet invalide :\n  - projet inconnu : « ${chaine.projet} »`);
  const roles = new Set(projet.roles.map((r) => r.id));
  const phases = new Set(projet.phases.map((p) => p.id));
  const problemes: string[] = [];
  const ids = new Set<string>();
  for (const e of chaine.etapes) {
    if (ids.has(e.id)) problemes.push(`étape en double : « ${e.id} »`);
    ids.add(e.id);
    for (const p of e.phases) if (!phases.has(p)) problemes.push(`étape « ${e.id} » : phase inconnue « ${p} »`);
    for (const r of Object.keys(e.actions)) if (!roles.has(r)) problemes.push(`étape « ${e.id} » : rôle inconnu « ${r} »`);
    if (Object.keys(e.actions).length === 0) problemes.push(`étape « ${e.id} » : aucune action de rôle`);
  }
  if (problemes.length > 0) throw new Error(`Chaîne du projet invalide :\n${problemes.map((p) => `  - ${p}`).join("\n")}`);
  return chaine;
}

/** Charge et valide content/chaine-projet.json. Appelé au build : toute erreur le fait échouer. */
export function chargerChaine(): Chaine {
  return validerChaine(JSON.parse(fs.readFileSync(FICHIER, "utf8")), chargerProjets());
}
