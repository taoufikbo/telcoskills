"use client";

import { RYTHME_MAX, RYTHME_MIN } from "@/produits/progression";
import { formaterArrivee, libelleSemaines } from "./format";
import type { Projection } from "./calcul";

type Props = {
  /** Compétences par semaine. */
  rythme: number;
  /** Événement de sortie : la personne change son rythme. */
  onChange: (competencesParSemaine: number) => void;
  /** Projection des compétences restantes à ce rythme. */
  projection: Projection;
};

/** Le rythme d'étude (réglable, en compétences par semaine) et ce qu'il donne : des semaines, une date d'arrivée. Estimation, jamais une promesse. */
export default function Rythme({ rythme, onChange, projection }: Props) {
  const bouton = "bouton !flex !h-9 !w-9 !items-center !justify-center !p-0 !text-base";
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2" role="group" aria-label="Rythme d'étude">
      <span className="mono" id="rythme-libelle">
        Rythme
      </span>
      <div className="flex items-center gap-2">
        <button type="button" className={bouton} onClick={() => onChange(rythme - 1)} disabled={rythme <= RYTHME_MIN} aria-label="Une compétence de moins par semaine">
          −
        </button>
        <output aria-labelledby="rythme-libelle" className="min-w-[10rem] text-center text-sm font-semibold tabular-nums">
          {rythme} compétence{rythme > 1 ? "s" : ""} par semaine
        </output>
        <button type="button" className={bouton} onClick={() => onChange(rythme + 1)} disabled={rythme >= RYTHME_MAX} aria-label="Une compétence de plus par semaine">
          +
        </button>
      </div>
      <p className="text-sm" aria-live="polite">
        {projection.arrivee ? (
          <>
            soit <strong className="font-semibold">{libelleSemaines(projection.semaines)}</strong>, arrivée vers le {formaterArrivee(projection.arrivee)}
          </>
        ) : (
          "Plus rien à faire sur ce parcours."
        )}
      </p>
    </div>
  );
}
