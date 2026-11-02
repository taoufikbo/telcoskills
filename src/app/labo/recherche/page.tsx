import type { Metadata } from "next";
import { chargerProjets } from "@/lib/projets";
import { chargerRoadmaps } from "@/lib/roadmaps";
import { construireIndex, LaboRecherche } from "@/produits/recherche";

export const metadata: Metadata = { title: "Labo : Recherche" };

export default function Page() {
  return <LaboRecherche index={construireIndex(chargerRoadmaps(), chargerProjets())} />;
}
