import type { Metadata } from "next";
import { chargerOrientation } from "@/lib/orientation";
import { getRoadmap } from "@/lib/roadmaps";
import { LaboProgression } from "@/produits/progression";

export const metadata: Metadata = { title: "Labo : Progression" };

export default function Page() {
  const premier = getRoadmap(chargerOrientation().ordre[0])?.noeuds[0];
  if (!premier) return <p>Aucune compétence dans le catalogue.</p>;
  return <LaboProgression essai={{ id: premier.id, titre: premier.titre }} />;
}
