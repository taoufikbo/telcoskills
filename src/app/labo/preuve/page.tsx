import type { Metadata } from "next";
import { chargerProjets } from "@/lib/projets";
import { chargerRoadmaps } from "@/lib/roadmaps";
import { chiffresCatalogue, Preuve } from "@/produits/preuve";

export const metadata: Metadata = { title: "Labo : Preuve" };

export default function Page() {
  return (
    <>
      <h1 className="text-3xl font-semibold">Preuve</h1>
      <p className="mono">Avec le catalogue publié :</p>
      <Preuve chiffres={chiffresCatalogue({ roadmaps: chargerRoadmaps(), projets: chargerProjets() })} />
      <p className="mono">Sans donnée, le bloc ne rend rien :</p>
      <div className="border border-dashed p-2" style={{ borderColor: "var(--bord)" }} data-vide>
        <Preuve chiffres={[]} />
      </div>
    </>
  );
}
