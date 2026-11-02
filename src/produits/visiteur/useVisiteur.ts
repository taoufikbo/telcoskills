"use client";

import { useReponsesEnregistrees } from "@/produits/parcours";
import { aDeLaProgression, usePratique } from "@/produits/progression";
import { calculerVisiteur, type EtatVisiteur, type Signaux } from "./etat";

/** Signaux lus auprès des produits Progression et Parcours (ce produit ne lit aucun stockage lui-même). */
export function useSignauxVisiteur(): Signaux {
  const { etat, pret: pratiqueLue } = usePratique();
  const { reponses, pret: parcoursLu } = useReponsesEnregistrees();
  return { pret: pratiqueLue && parcoursLu, progression: aDeLaProgression(etat), parcours: reponses !== null };
}

export function useVisiteur(): EtatVisiteur {
  return calculerVisiteur(useSignauxVisiteur());
}
