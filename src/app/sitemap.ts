import type { MetadataRoute } from "next";
import { analysesPubliees } from "@/lib/analyses";
import { INSTANCE } from "@/lib/instance";
import { roadmapDeReference } from "@/lib/noeuds";
import { chargerOrientation } from "@/lib/orientation";
import { chargerRoadmaps } from "@/lib/roadmaps";
import { lienVisible, sectionsVisibles } from "@/lib/sections";
import { urlAbsolue } from "@/lib/site";
import { BASE_PROJET, BASE_ROADMAPS, urlNoeud, urlRoadmap } from "@/lib/urls";

/**
 * Plan du site : uniquement les pages à indexer. Les sections non rédigées (noindex) en sont absentes ;
 * pour une compétence partagée entre roadmaps, seule la page de la roadmap de référence figure (les autres pointent vers elle par `canonical`).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!INSTANCE.refonte || !INSTANCE.indexable) return [];
  const roadmaps = chargerRoadmaps();
  const ordre = chargerOrientation().ordre;
  const analyses = await analysesPubliees();

  const chemins = [
    "/",
    "/ressources",
    BASE_ROADMAPS,
    BASE_PROJET,
    "/ressources/landscape",
    "/sylva",
    "/a-propos",
    "/contact",
    ...roadmaps.map((r) => urlRoadmap(r.id)),
    ...roadmaps.flatMap((r) => r.noeuds.filter((n) => roadmapDeReference(roadmaps, n.id, ordre) === r.id).map((n) => urlNoeud(r.id, n.id))),
    ...analyses.filter((a) => !a.meta.brouillon).map((a) => `/analyses/${a.slug}`),
  ];
  const sections = await sectionsVisibles();
  return chemins.filter((c) => lienVisible(sections, c)).map((c) => ({ url: urlAbsolue(c) }));
}
