import { chargerProjets } from "@/lib/projets";
import { construireIndex } from "@/produits/recherche";
import { chargerRoadmaps } from "@/lib/roadmaps";

export const dynamic = "force-static";

/** Index de la recherche (⌘K), servi en fichier statique et chargé à la première ouverture. */
export function GET() {
  return Response.json(construireIndex(chargerRoadmaps(), chargerProjets()));
}
