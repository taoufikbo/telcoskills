import { cartesDesDeparts } from "@/lib/cartesDeparts";

export const dynamic = "force-static";

/** Cartes des points de départ du diagnostic, servies en fichier statique et chargées seulement après un diagnostic (environ 90 Ko). */
export function GET() {
  return Response.json(cartesDesDeparts());
}
