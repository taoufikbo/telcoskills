import { getRoadmap } from "@/lib/roadmaps";
import { CarteHeros, disposerCarte } from "@/produits/carte-heros";

/**
 * Schéma de dépendances pour les analyses : le graphe de prérequis réel d'une ou plusieurs compétences,
 * au même style que le graphe de l'accueil. Usage en MDX : <Diagram roadmap="architecte-caas-telco" cibles={["dimensionnement"]} legende="…" />
 */
export default function Diagram({ roadmap, cibles, legende }: { roadmap: string; cibles: string[]; legende?: string }) {
  const r = getRoadmap(roadmap);
  if (!r || cibles.some((c) => !r.noeuds.some((n) => n.id === c))) return null;
  return (
    <figure className="panneau not-prose my-8 p-4 sm:p-5">
      <CarteHeros disposition={disposerCarte(r, cibles)} />
      {legende && <figcaption className="mono mt-3">{legende}</figcaption>}
    </figure>
  );
}
