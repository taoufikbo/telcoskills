"use client";

import Link from "next/link";
import { useState, type ComponentProps, type ReactNode } from "react";
import { classerParcours, type Reponses } from "@/lib/orientation-schema";
import type { Disposition } from "@/produits/carte-heros";
import { Diagnostic } from "@/produits/diagnostic";
import CarteHerosSuivie from "./CarteHerosSuivie";
import ProgrammeChoisi from "./ProgrammeChoisi";

type PropsDiagnostic = Omit<ComponentProps<typeof Diagnostic>, "apresResultat" | "onBrouillon" | "seulementSiPartage">;

type Props = PropsDiagnostic & {
  /** Carte affichée avant toute réponse, et sa légende. */
  carteParDefaut: Disposition;
  legendeCarte: ReactNode;
  /** Nombre d'outils du landscape, pour le renvoi sous la carte. */
  nbOutils: number;
};

/**
 * Raccord de page : le diagnostic et la carte du hero côte à côte. Dès la première réponse, la carte montre le parcours
 * probable ; une fois les trois réponses données, le chemin exact (c'est CarteHerosSuivie qui lit les réponses enregistrées).
 * Les deux produits ne se connaissent pas : seul ce raccord les relie.
 */
export default function ChoixEtCarte({ carteParDefaut, legendeCarte, nbOutils, ...diagnostic }: Props) {
  const [brouillon, setBrouillon] = useState<Partial<Reponses>>({});
  const apercu = Object.keys(brouillon).length > 0 ? classerParcours(diagnostic.config, brouillon)[0] : null;

  return (
    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] xl:gap-12">
      <Diagnostic
        {...diagnostic}
        onBrouillon={setBrouillon}
        apresResultat={(reco) => <ProgrammeChoisi roadmapId={reco.roadmapId} parNiveau={diagnostic.config.duree_par_niveau_heures} />}
      />
      <figure className="panneau w-full p-4 sm:p-5">
        <CarteHerosSuivie defaut={carteParDefaut} config={diagnostic.config} legendeDefaut={legendeCarte} apercu={apercu} />
        <p className="mono mt-3 border-t pt-3" style={{ borderColor: "var(--filet)" }}>
          Et les outils ?{" "}
          <Link href="/ressources/landscape" className="underline" style={{ color: "var(--fg)" }}>
            {nbOutils} outils de la pile, par rôle : voir le landscape
          </Link>
        </p>
      </figure>
    </div>
  );
}
