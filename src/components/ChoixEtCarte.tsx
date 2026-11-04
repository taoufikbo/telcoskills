"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
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
  /** Parcours joués en exemple sur la carte tant que le visiteur n'a rien choisi (du plus proche du cloud au plus proche du télécom). */
  exemples: string[];
};

/**
 * Raccord de page : la conversation et la carte du hero côte à côte. Dès la première réponse, la carte montre le parcours
 * probable ; à la fin, le chemin exact, avec le programme et ses heures. Les produits Diagnostic (calcul), Parcours
 * (stockage) et Carte héros ne se connaissent pas : seul ce raccord les relie.
 */
export default function ChoixEtCarte({ config, parcours, titresNoeuds, durees, carteParDefaut, legendeCarte, nbOutils, exemples }: Props) {
  const [brouillon, setBrouillon] = useState<Partial<Reponses>>({});
  const [resultat, setResultat] = useState<{ roadmapId: string; noeudId: string } | null>(null);
  const [aInteragi, setAInteragi] = useState(false);
  const [pause, setPause] = useState(false);
  const [rang, setRang] = useState(-1);
  const apercuReel = !resultat && Object.keys(brouillon).length > 0 ? classerParcours(config, brouillon)[0] : null;

  // Exemple joué sur la carte : un parcours après l'autre, tant que le visiteur n'a rien fait, avec une pause possible.
  // Rien ne bouge si le visiteur demande moins de mouvement.
  useEffect(() => {
    if (aInteragi || pause || exemples.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setRang((r) => (r + 1) % exemples.length), rang < 0 ? 3000 : 5500);
    return () => clearTimeout(t);
  }, [rang, aInteragi, pause, exemples.length]);
  const exempleVisible = !aInteragi && rang >= 0;
  const apercu = apercuReel ?? (exempleVisible ? exemples[rang] : null);

  return (
    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:gap-12">
      <div className="space-y-5">
        <ConversationParcours config={config} parcours={parcours} titresNoeuds={titresNoeuds} durees={durees} onBrouillon={(r) => {
            setBrouillon(r);
            setAInteragi(true);
          }} onResultat={setResultat} />
        {resultat && <ProgrammeChoisi roadmapId={resultat.roadmapId} parNiveau={config.duree_par_niveau_heures} />}
      </div>
      <figure className="panneau w-full p-4 sm:p-5 xl:sticky xl:top-20">
        <CarteHerosSuivie defaut={carteParDefaut} config={config} legendeDefaut={legendeCarte} choix={resultat ?? undefined} apercu={apercu} exemple={!apercuReel && !resultat && exempleVisible} />
        {exempleVisible && !apercuReel && !resultat && (
          <p className="mono mt-2" style={{ fontSize: "0.75rem" }}>
            <button type="button" onClick={() => setPause((p) => !p)} aria-pressed={pause} className="underline underline-offset-4">
              {pause ? "Reprendre les exemples" : "Mettre les exemples en pause"}
            </button>
          </p>
        )}
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
