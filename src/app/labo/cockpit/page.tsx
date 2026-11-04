import type { Metadata } from "next";
import { chargerOrientation } from "@/lib/orientation";
import { getRoadmap } from "@/lib/roadmaps";
import { LaboCockpit } from "@/produits/cockpit";

export const metadata: Metadata = { title: "Labo : Cockpit" };

export default function Page() {
  const r = getRoadmap("ingenieur-caas-telco");
  if (!r) return <p>Roadmap absente du catalogue.</p>;
  return <LaboCockpit roadmap={r} table={chargerOrientation().investissement_par_palier} />;
}
