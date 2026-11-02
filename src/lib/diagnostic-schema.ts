import { z } from "zod";
import type { Roadmap } from "./schema";

export const DiagnosticSchema = z
  .object({
    _aide: z.string().optional(),
    brouillon: z.boolean(),
    seuils: z.object({ solide: z.number().int().positive(), enProgres: z.number().int().positive() }),
    blocs: z.array(z.object({ id: z.string().min(1), titre: z.string().min(1), noeuds: z.array(z.string().min(1)).min(1) })).min(1),
    questions: z
      .array(z.object({ id: z.string().min(1), bloc: z.string().min(1), texte: z.string().min(1), options: z.array(z.string().min(1)).length(4) }))
      .min(1),
  })
  .superRefine((d, ctx) => {
    const blocs = new Set(d.blocs.map((b) => b.id));
    for (const q of d.questions) if (!blocs.has(q.bloc)) ctx.addIssue({ code: "custom", message: `La question « ${q.id} » cite un bloc inconnu : « ${q.bloc} »`, path: ["questions"] });
    for (const b of d.blocs) if (!d.questions.some((q) => q.bloc === b.id)) ctx.addIssue({ code: "custom", message: `Le bloc « ${b.id} » n'a aucune question`, path: ["blocs"] });
    if (d.seuils.enProgres >= d.seuils.solide) ctx.addIssue({ code: "custom", message: "Le seuil « en progrès » doit être inférieur au seuil « solide »", path: ["seuils"] });
  });

export type Diagnostic = z.infer<typeof DiagnosticSchema>;
export type Niveau = "a-consolider" | "en-progres" | "solide";
export type ResultatBloc = { id: string; titre: string; points: number; maximum: number; niveau: Niveau; noeuds: string[] };
export type Resultat = { points: number; maximum: number; pourcentage: number; blocs: ResultatBloc[] };

/** Problèmes de cohérence avec les roadmaps : toute compétence citée doit exister dans la roadmap de référence. */
export function problemesDiagnostic(d: Diagnostic, roadmap: Roadmap): string[] {
  const ids = new Set(roadmap.noeuds.map((n) => n.id));
  return d.blocs.flatMap((b) => b.noeuds.filter((n) => !ids.has(n)).map((n) => `Le bloc « ${b.id} » cite une compétence absente de « ${roadmap.id} » : « ${n} »`));
}

/** Réponses : identifiant de question → indice de l'option choisie (0 à 3, égal au nombre de points). */
export type Reponses = Record<string, number>;

export function niveauDuBloc(points: number, seuils: Diagnostic["seuils"]): Niveau {
  return points >= seuils.solide ? "solide" : points >= seuils.enProgres ? "en-progres" : "a-consolider";
}

/** Calcule le score de chaque bloc et le score global. Une question sans réponse compte 0. Calcul local, rien n'est envoyé. */
export function calculer(d: Diagnostic, reponses: Reponses): Resultat {
  const blocs = d.blocs.map((b) => {
    const questions = d.questions.filter((q) => q.bloc === b.id);
    const points = questions.reduce((s, q) => s + Math.min(3, Math.max(0, reponses[q.id] ?? 0)), 0);
    return { id: b.id, titre: b.titre, points, maximum: questions.length * 3, niveau: niveauDuBloc(points, d.seuils), noeuds: b.noeuds };
  });
  const points = blocs.reduce((s, b) => s + b.points, 0);
  const maximum = blocs.reduce((s, b) => s + b.maximum, 0);
  return { points, maximum, pourcentage: maximum === 0 ? 0 : Math.round((points / maximum) * 100), blocs };
}

export const reponsesCompletes = (d: Diagnostic, reponses: Reponses) => d.questions.every((q) => reponses[q.id] !== undefined);
