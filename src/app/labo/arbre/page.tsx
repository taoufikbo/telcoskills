import type { Metadata } from "next";
import { getRoadmap } from "@/lib/roadmaps";
import { LaboArbre } from "@/produits/arbre";

export const metadata: Metadata = { title: "Labo : Arbre" };

export default function Page() {
  const roadmap = getRoadmap("ingenieur-caas-telco");
  if (!roadmap) return <p>Roadmap absente du catalogue.</p>;
  return <LaboArbre roadmap={roadmap} />;
}
