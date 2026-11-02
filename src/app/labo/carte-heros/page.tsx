import type { Metadata } from "next";
import { getRoadmap } from "@/lib/roadmaps";
import { disposerCarte, LaboCarteHeros } from "@/produits/carte-heros";

export const metadata: Metadata = { title: "Labo : Carte héros" };

export default function Page() {
  const roadmap = getRoadmap("ingenieur-caas-telco");
  if (!roadmap) return <p>Roadmap absente du catalogue.</p>;
  return <LaboCarteHeros disposition={disposerCarte(roadmap, ["sriov", "ocp-rds"])} />;
}
