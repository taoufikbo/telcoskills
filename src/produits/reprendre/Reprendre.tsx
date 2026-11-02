"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { Orientation } from "@/lib/orientation-schema";
import { urlNoeud, urlRoadmap } from "@/lib/urls";
import { useReponsesEnregistrees } from "@/produits/parcours";
import { suivreParcours, usePratique } from "@/produits/progression";
import { calculerReprise, type RoadmapReprise } from "./calcul";

type Props = {
  roadmaps: RoadmapReprise[];
  config: Orientation;
  /** Affiché quand il n'y a rien à reprendre (le bloc lui-même se masque). */
  sinon?: ReactNode;
};

/** « Reprendre » : le parcours, son avancement et un seul bouton vers la prochaine compétence. */
export default function Reprendre({ roadmaps, config, sinon = null }: Props) {
  const { etat, now, muter, pret } = usePratique();
  const { reponses, pret: parcoursLu } = useReponsesEnregistrees();
  if (!pret || !parcoursLu) return null;
  const reprise = calculerReprise({ etat, reponses, config, roadmaps, now });
  if (!reprise) return <>{sinon}</>;

  const { decompte: d } = reprise;
  const choisir = () => muter((e) => suivreParcours(e, reprise.roadmapId));
  return (
    <section aria-labelledby="titre-reprendre" className="space-y-4">
      <p className="mono" style={{ color: "var(--muted)" }}>
        {reprise.origine === "parcours" ? "Votre parcours" : "Le parcours recommandé pour vous"}
      </p>
      <h2 id="titre-reprendre" className="text-2xl font-semibold">
        <Link href={urlRoadmap(reprise.roadmapId)} className="hover:underline">
          {reprise.titreRoadmap}
        </Link>
      </h2>
      {reprise.origine === "parcours" && (
        <div className="max-w-md space-y-2">
          <p className="text-sm">
            {d.acquis} compétence{d.acquis > 1 ? "s" : ""} acquise{d.acquis > 1 ? "s" : ""} sur {d.actifs}
            {d.vus > 0 ? `, ${d.vus} vue${d.vus > 1 ? "s" : ""}` : ""}
            {d.aRevoir > 0 ? `, ${d.aRevoir} à revoir` : ""}
          </p>
          <div className="h-1.5 w-full rounded-full" style={{ background: "var(--filet)" }} role="progressbar" aria-label="Avancement du parcours" aria-valuemin={0} aria-valuemax={100} aria-valuenow={d.pourcentage}>
            <div className="h-full rounded-full" style={{ width: `${d.pourcentage}%`, background: "var(--fg)" }} />
          </div>
        </div>
      )}
      {reprise.noeud ? (
        <Link href={urlNoeud(reprise.roadmapId, reprise.noeud.id)} onClick={choisir} className="btn btn-primary">
          {reprise.origine === "parcours" ? "Reprendre" : "Commencer"} : {reprise.noeud.titre}
        </Link>
      ) : (
        <p>
          Toutes les compétences de ce parcours sont acquises ou mises de côté.{" "}
          <Link href={urlRoadmap(reprise.roadmapId)} className="underline">
            Voir la roadmap
          </Link>
        </p>
      )}
    </section>
  );
}
