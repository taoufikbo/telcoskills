import { z } from "zod";
import { ecartJours } from "@/lib/jour";

/** Le choix vaut six mois, puis la question est reposée (durée de conservation du choix : hypothèse de ce site, à confirmer). */
export const VALIDITE_JOURS = 182;

export type Choix = "accepte" | "refuse";

const ChoixStocke = z.object({ choix: z.enum(["accepte", "refuse"]), jour: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

/** Le choix mémorisé ; null s'il n'y en a pas, s'il est illisible ou s'il a plus de six mois (il faut alors redemander). Pure. */
export function lireChoix(brut: string | null, aujourdhui: string): Choix | null {
  if (!brut) return null;
  try {
    const res = ChoixStocke.safeParse(JSON.parse(brut));
    if (!res.success || ecartJours(res.data.jour, aujourdhui) >= VALIDITE_JOURS) return null;
    return res.data.choix;
  } catch {
    return null;
  }
}

export const serialiserChoix = (choix: Choix, aujourdhui: string): string => JSON.stringify({ choix, jour: aujourdhui });
