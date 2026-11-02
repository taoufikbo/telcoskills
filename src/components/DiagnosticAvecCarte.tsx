"use client";

import type { ComponentProps } from "react";
import { Diagnostic } from "@/produits/diagnostic";
import CarteHerosSuivie from "./CarteHerosSuivie";
import ProgrammeChoisi from "./ProgrammeChoisi";

/**
 * Raccord de page : le diagnostic, et dans son résultat la carte du chemin recommandé (de votre point de départ
 * à la compétence la plus avancée qui s'appuie dessus). Les deux produits ne se connaissent pas.
 */
export default function DiagnosticAvecCarte(props: Omit<ComponentProps<typeof Diagnostic>, "apresResultat">) {
  return (
    <Diagnostic
      {...props}
      apresResultat={(reco) => (
        <>
          <ProgrammeChoisi roadmapId={reco.roadmapId} parNiveau={props.config.duree_par_niveau_heures} />
          <figure className="panneau p-4 sm:p-5">
            <CarteHerosSuivie config={props.config} choix={reco} />
          </figure>
        </>
      )}
    />
  );
}
