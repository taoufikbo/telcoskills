import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import CarteProjet from "@/components/carte/CarteProjet";
import { apprentissagePourProjet, chargerProjets, resoudreProjet } from "@/lib/projets";
import { exigerRefonte } from "@/lib/refonte";

export function generateMetadata(): Metadata {
  const p = chargerProjets()[0];
  if (!p) return {};
  const titre = `Carte interactive : ${p.titre}`;
  const description = "Rôles, phases, jalons et compétences sur une seule carte : couloirs, flux et matrice liés.";
  return { title: titre, description, openGraph: { title: titre, description } };
}

export default function PageCarteProjetFilRouge() {
  exigerRefonte();
  const brut = chargerProjets()[0];
  if (!brut) notFound();
  const { projet, roadmapsDesRoles } = resoudreProjet(brut);
  return (
    <Suspense>
      <CarteProjet projet={projet} roadmapsDesRoles={roadmapsDesRoles} apprentissage={apprentissagePourProjet(projet)} />
    </Suspense>
  );
}
