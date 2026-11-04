"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { classerParcours, type Orientation, type Reponses } from "@/lib/orientation-schema";
import type { Disposition } from "@/produits/carte-heros";
import CarteHerosSuivie from "./CarteHerosSuivie";
import ConversationParcours from "./ConversationParcours";
import ProgrammeChoisi from "./ProgrammeChoisi";

type Props = {
  config: Orientation;
  parcours: Record<string, { titre: string }>;
  titresNoeuds: Record<string, string>;
  durees: Record<string, { noeud: number }>;
  /** Carte affichée avant toute réponse, et sa légende. */
  carteParDefaut: Disposition;
  legendeCarte: ReactNode;
  nbOutils: number;
};

/**
 * Raccord de page : la conversation et la carte du hero côte à côte. Dès la première réponse, la carte montre le parcours
 * probable ; à la fin, le chemin exact, avec le programme et ses heures. Les produits Diagnostic (calcul), Parcours
 * (stockage) et Carte héros ne se connaissent pas : seul ce raccord les relie.
 */
export default function ChoixEtCarte({ config, parcours, titresNoeuds, durees, carteParDefaut, legendeCarte, nbOutils }: Props) {
  const [brouillon, setBrouillon] = useState<Partial<Reponses>>({});
  const [resultat, setResultat] = useState<{ roadmapId: string; noeudId: string } | null>(null);
  const apercu = !resultat && Object.keys(brouillon).length > 0 ? classerParcours(config, brouillon)[0] : null;

  return (
    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:gap-12">
      <div className="space-y-5">
        <ConversationParcours config={config} parcours={parcours} titresNoeuds={titresNoeuds} durees={durees} onBrouillon={setBrouillon} onResultat={setResultat} />
        {resultat && <ProgrammeChoisi roadmapId={resultat.roadmapId} parNiveau={config.duree_par_niveau_heures} />}
      </div>
      <figure className="panneau w-full p-4 sm:p-5 xl:sticky xl:top-20">
        <CarteHerosSuivie defaut={carteParDefaut} config={config} legendeDefaut={legendeCarte} choix={resultat ?? undefined} apercu={apercu} />
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
