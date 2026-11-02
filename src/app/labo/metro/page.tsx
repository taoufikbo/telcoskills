import type { Metadata } from "next";
import { getRoadmap } from "@/lib/roadmaps";
import { LaboMetro } from "@/produits/metro";

export const metadata: Metadata = { title: "Labo : Métro" };

export default function Page() {
  const roadmap = getRoadmap("ingenieur-caas-telco");
  if (!roadmap) return <p>Roadmap absente du catalogue.</p>;
  return <LaboMetro roadmap={roadmap} />;
}
