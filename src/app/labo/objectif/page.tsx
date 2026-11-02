import type { Metadata } from "next";
import { getRoadmap } from "@/lib/roadmaps";
import { LaboObjectif } from "@/produits/objectif";

export const metadata: Metadata = { title: "Labo : Objectif" };

export default function Page() {
  const roadmap = getRoadmap("ingenieur-caas-telco");
  if (!roadmap) return <p>Roadmap absente du catalogue.</p>;
  return <LaboObjectif roadmap={roadmap} />;
}
