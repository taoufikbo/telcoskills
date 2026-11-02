import { programmesDesParcours } from "@/lib/programmes";

export const dynamic = "force-static";

/** Programmes des parcours recommandables (blocs, compétences, heures estimées), chargés seulement après un diagnostic. */
export function GET() {
  return Response.json(programmesDesParcours());
}
