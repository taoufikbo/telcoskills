import { imageOg, TAILLE_OG } from "@/lib/imageOg";
import { INSTANCE } from "@/lib/instance";
import { chargerRoadmaps, getRoadmap } from "@/lib/roadmaps";

export const alt = `Roadmap ${INSTANCE.nom}`;
export const size = TAILLE_OG;
export const contentType = "image/png";

export function generateStaticParams() {
  return INSTANCE.refonte ? chargerRoadmaps().map((r) => ({ roadmap: r.id })) : [];
}

export default async function Image({ params }: { params: Promise<{ roadmap: string }> }) {
  const { roadmap } = await params;
  const r = getRoadmap(roadmap)!;
  return imageOg(r.titre, `${r.noeuds.length} compétences · ${r.blocs.length} blocs`);
}
