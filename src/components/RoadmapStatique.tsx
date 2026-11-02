import Link from "next/link";
import type { ReactNode } from "react";
import { LIBELLE_NIVEAU } from "@/lib/libelles";
import type { Roadmap } from "@/lib/schema";
import { urlPageNoeud } from "@/lib/urls";

/**
 * Le contenu d'une roadmap tel qu'il est servi dans le HTML, **sans JavaScript**.
 * La vue interactive (`RoadmapView`) lit l'adresse (`useSearchParams`) : Next la rend alors uniquement dans le navigateur.
 * Ce composant sert de repli à cette frontière : il est dans le HTML initial (curl, moteurs de recherche, navigation sans JavaScript),
 * puis la vue interactive le remplace au chargement. Chaque compétence renvoie vers sa propre page.
 */
export default function RoadmapStatique({ roadmap, entete }: { roadmap: Roadmap; entete?: ReactNode }) {
  return (
    <div className="px-4 py-3">
      <h1 className="text-xl font-bold">{roadmap.titre}</h1>
      {entete}
      {roadmap.presentation && <p className="mt-2 max-w-3xl text-sm">{roadmap.presentation}</p>}
      {roadmap.blocs.map((bloc) => (
        <section key={bloc} aria-label={bloc} className="mt-6">
          <h2 className="font-bold">{bloc}</h2>
          <ul className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
            {roadmap.noeuds
              .filter((n) => n.bloc === bloc)
              .map((n) => (
                <li key={n.id} className="py-2">
                  <Link href={urlPageNoeud(roadmap.id, n.id)} className="font-semibold underline decoration-orange decoration-2 underline-offset-4">
                    {n.titre}
                  </Link>
                  <span className="text-xs text-slate-600 dark:text-slate-400"> · {LIBELLE_NIVEAU[n.niveau]}</span>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{n.resume}</p>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
