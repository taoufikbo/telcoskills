import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { chargerLandscape } from "@/produits/landscape";
import { chargerRoadmaps } from "./roadmaps";

const DOSSIER = path.join(/*turbopackIgnore: true*/ process.cwd(), "content");

const texte = z.string().min(1);
const SourceSchema = z.object({ nom: texte, url: z.string().url().startsWith("https://") });
/** Une affirmation n'existe qu'avec sa source. */
const FaitSchema = z.object({ texte, source: SourceSchema });

export const SylvaSchema = z.object({
  _aide: z.string().optional(),
  roadmap: texte,
  intro: texte,
  sourceIntro: SourceSchema,
  faits: z.array(FaitSchema).min(1),
  fonctionnement: z.array(FaitSchema).min(1),
  /** Unit de Sylva → même logiciel dans le landscape général. */
  liensLandscape: z.record(z.string(), z.string()),
  suse: z.object({ intro: texte, faits: z.array(FaitSchema).min(1) }),
  limites: z.array(texte).min(1),
});
export type Sylva = z.infer<typeof SylvaSchema>;

export const MATURITES = ["core-component", "stable", "beta", "experimental"] as const;

/** Liste officielle des composants, importée de sylva-core par scripts/importer-units-sylva.mjs. */
export const UnitsSylvaSchema = z.object({
  _aide: z.string().optional(),
  source: z.string().url(),
  luLe: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fonctions: z.record(z.string(), texte),
  units: z
    .array(
      z.object({
        id: texte,
        description: texte,
        maturite: z.enum(MATURITES).nullable(),
        source: z.string().nullable(),
        version: z.string().nullable(),
        fonction: texte,
        suse: z.boolean(),
      }),
    )
    .min(1),
});
export type UnitsSylva = z.infer<typeof UnitsSylvaSchema>;
export type UnitSylva = UnitsSylva["units"][number];

/** Contrôles de cohérence : roadmap existante, liens vers des units et des outils existants, fonctions déclarées. */
export function problemesSylva(s: Sylva, u: UnitsSylva, roadmaps: { id: string }[], outils: { id: string }[]): string[] {
  const problemes: string[] = [];
  if (!roadmaps.some((r) => r.id === s.roadmap)) problemes.push(`roadmap inconnue « ${s.roadmap} »`);
  const units = new Set(u.units.map((x) => x.id));
  const connus = new Set(outils.map((o) => o.id));
  for (const [unit, outil] of Object.entries(s.liensLandscape)) {
    if (!units.has(unit)) problemes.push(`liensLandscape : unit inconnue « ${unit} »`);
    if (!connus.has(outil)) problemes.push(`liensLandscape : outil absent du landscape « ${outil} »`);
  }
  for (const x of u.units) if (!u.fonctions[x.fonction]) problemes.push(`unit « ${x.id} » : fonction non déclarée « ${x.fonction} »`);
  return problemes;
}

const lire = (fichier: string) => JSON.parse(fs.readFileSync(path.join(DOSSIER, fichier), "utf8"));

/** Charge et valide content/sylva.json et content/sylva-units.json. Appelé au build : toute erreur le fait échouer. */
export function chargerSylva(): { sylva: Sylva; units: UnitsSylva } {
  const s = SylvaSchema.safeParse(lire("sylva.json"));
  const u = UnitsSylvaSchema.safeParse(lire("sylva-units.json"));
  const erreurs = [...(s.success ? [] : s.error.issues), ...(u.success ? [] : u.error.issues)];
  if (!s.success || !u.success) throw new Error(`Sylva invalide :\n${erreurs.map((i) => `  - ${i.path.join(".")} : ${i.message}`).join("\n")}`);
  const problemes = problemesSylva(s.data, u.data, chargerRoadmaps(), chargerLandscape().outils);
  if (problemes.length > 0) throw new Error(`Sylva invalide :\n${problemes.map((p) => `  - ${p}`).join("\n")}`);
  return { sylva: s.data, units: u.data };
}
