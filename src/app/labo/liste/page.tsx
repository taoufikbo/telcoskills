import type { Metadata } from "next";
import { getRoadmap } from "@/lib/roadmaps";
import { LaboListe } from "@/produits/liste";

export const metadata: Metadata = { title: "Labo : Liste" };

export default function Page() {
  const r = getRoadmap("ingenieur-caas-telco");
  if (!r) return <p>Roadmap absente du catalogue.</p>;
  const roadmap = { blocs: r.blocs, noeuds: r.noeuds.map(({ id, titre, bloc, niveau, demande }) => ({ id, titre, bloc, niveau, demande })) };
  return <LaboListe roadmap={roadmap} />;
}
