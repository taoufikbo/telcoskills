"use client";

import { useMemo } from "react";
import type { Orientation } from "@/lib/orientation-schema";
import { urlNoeud, urlRoadmap } from "@/lib/urls";
import { Sommaire, calculerProgramme, type RoadmapProgramme } from "@/produits/cockpit";
import { suiviNoeud, usePratique } from "@/produits/progression";

/**
 * Raccord de page (pas un produit) : la barre de gauche d'une page de compétence. Le rendu serveur donne le programme et ses liens ;
 * dès que le navigateur est lu, les statuts et l'avancement s'y ajoutent (progression du produit Progression, jamais lue par le Sommaire).
 */
export default function SommaireParcours({ roadmap, titre, parNiveau, courant }: { roadmap: RoadmapProgramme; titre: string; parNiveau: Orientation["duree_par_niveau_heures"]; courant: string }) {
  const { etat, now, pret } = usePratique();
  const programme = useMemo(
    () => calculerProgramme(roadmap, parNiveau, pret ? (id) => suiviNoeud(etat, roadmap.id, id, now) : undefined),
    [roadmap, parNiveau, pret, etat, now],
  );
  return <Sommaire programme={programme} titre={titre} hrefParcours={urlRoadmap(roadmap.id)} courant={courant} href={(id) => urlNoeud(roadmap.id, id)} suivi={pret} />;
}
