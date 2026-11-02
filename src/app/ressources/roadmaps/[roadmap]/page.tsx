import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import BadgeProvenance from "@/components/BadgeProvenance";
import JsonLd from "@/components/JsonLd";
import RoadmapStatique from "@/components/RoadmapStatique";
import RoadmapView from "@/components/RoadmapView";
import { filAriane, roadmapLd } from "@/lib/donneesStructurees";
import { INSTANCE } from "@/lib/instance";
import { exigerRefonte } from "@/lib/refonte";
import { chargerProjets } from "@/lib/projets";
import { chargerRoadmaps, getRoadmap } from "@/lib/roadmaps";
import { rubriqueThematique } from "@/lib/rubriques";
import { BASE_ROADMAPS, urlNoeud, urlRoadmap } from "@/lib/urls";
import { infoVideo } from "@/lib/videos";

export const dynamicParams = false;

export function generateStaticParams() {
  return INSTANCE.refonte ? chargerRoadmaps().map((r) => ({ roadmap: r.id })) : [];
}

export async function generateMetadata({ params }: { params: Promise<{ roadmap: string }> }): Promise<Metadata> {
  const { roadmap } = await params;
  const r = getRoadmap(roadmap);
  if (!r) return {};
  const description = `Roadmap « ${r.titre} » : ${r.noeuds.length} compétences en ${r.blocs.length} blocs, avec prérequis, ressources et suivi de progression.`;
  return { title: r.titre, description, alternates: { canonical: urlRoadmap(r.id) }, openGraph: { title: r.titre, description } };
}

export default async function PageRoadmap({ params }: { params: Promise<{ roadmap: string }> }) {
  exigerRefonte();
  const { roadmap: id } = await params;
  const roadmap = getRoadmap(id);
  if (!roadmap) notFound();
  return (
    <main>
      <JsonLd data={roadmapLd(roadmap, urlRoadmap(roadmap.id), (n) => urlNoeud(roadmap.id, n))} />
      <JsonLd
        data={filAriane([
          { nom: INSTANCE.nom, chemin: "/" },
          rubriqueThematique(roadmap.id) ? { nom: rubriqueThematique(roadmap.id)!.nom, chemin: rubriqueThematique(roadmap.id)!.href } : { nom: "Roadmaps", chemin: BASE_ROADMAPS },
          { nom: roadmap.titre, chemin: urlRoadmap(roadmap.id) },
        ])}
      />
      <Suspense fallback={<RoadmapStatique roadmap={roadmap} entete={<BadgeProvenance roadmap={roadmap} />} />}>
        <RoadmapView roadmap={roadmap} video={infoVideo(roadmap.id)} projetId={chargerProjets()[0]?.id} entete={<BadgeProvenance roadmap={roadmap} />} />
      </Suspense>
    </main>
  );
}
