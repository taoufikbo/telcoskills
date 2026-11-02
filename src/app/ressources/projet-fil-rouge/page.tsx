import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import ChaineProjet from "@/components/ChaineProjet";
import JsonLd from "@/components/JsonLd";
import ProjetStatique from "@/components/ProjetStatique";
import ProjetView from "@/components/ProjetView";
import { chargerChaine } from "@/lib/chaine";
import { filAriane } from "@/lib/donneesStructurees";
import { INSTANCE } from "@/lib/instance";
import { urlProjet } from "@/lib/urls";
import { chargerProjets, resoudreProjet } from "@/lib/projets";
import { exigerRefonte } from "@/lib/refonte";

/** Le site n'a qu'un projet fil rouge : il occupe cette adresse. */
export function generateMetadata(): Metadata {
  const p = chargerProjets()[0];
  return p ? { title: p.titre, description: p.resume, openGraph: { title: p.titre, description: p.resume } } : {};
}

export default function PageProjetFilRouge() {
  exigerRefonte();
  const brut = chargerProjets()[0];
  if (!brut) notFound();
  const { projet, roadmapsDesRoles } = resoudreProjet(brut);
  return (
    <>
      <JsonLd
        data={filAriane([
          { nom: INSTANCE.nom, chemin: "/" },
          { nom: projet.titre, chemin: urlProjet(projet.id) },
        ])}
      />
      <ChaineProjet etapes={chargerChaine().etapes} roles={projet.roles.map((r) => ({ id: r.id, libelle: r.libelle }))} projetId={projet.id} />
      <Suspense fallback={<ProjetStatique projet={projet} />}>
      <ProjetView projet={projet} roadmapsDesRoles={roadmapsDesRoles} />
      </Suspense>
    </>
  );
}
