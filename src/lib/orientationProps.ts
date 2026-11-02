import { heuresEstimees } from "./duree";
import { chargerOrientation } from "./orientation";
import { chargerProjets } from "./projets";
import { blocsTestables } from "./positionnement";
import { chargerRoadmaps } from "./roadmaps";

/** Données du questionnaire « Par où commencer ? » : parcours, premiers nœuds et projets, prêts à passer au composant client. */
export function proprietesOrientation() {
  const roadmaps = chargerRoadmaps();
  const config = chargerOrientation();
  const projets = chargerProjets();
  const parId = new Map(roadmaps.map((r) => [r.id, r]));

  const parcours = Object.fromEntries(roadmaps.map((r) => [r.id, { titre: r.titre, presentation: r.presentation }]));
  const titresNoeuds: Record<string, string> = {};
  for (const [roadmapId, departs] of Object.entries(config.premiers_noeuds))
    for (const noeudId of Object.values(departs)) titresNoeuds[`${roadmapId}/${noeudId}`] = parId.get(roadmapId)!.noeuds.find((n) => n.id === noeudId)!.titre;
  const projetsPourAssistant = projets.map((p) => ({
    id: p.id,
    titre: p.titre,
    roles: Object.fromEntries(p.roles.filter((r) => r.roadmap).map((r) => [r.roadmap!, r.id])),
  }));
  const h = config.duree_par_niveau_heures;
  const durees = {
    // Pour chaque nœud de départ possible : sa durée, et celle du bloc de compétences auquel il appartient.
    noeuds: Object.fromEntries(
      Object.entries(config.premiers_noeuds).flatMap(([roadmapId, departs]) =>
        Object.values(departs).map((noeudId) => {
          const roadmap = parId.get(roadmapId)!;
          const noeud = roadmap.noeuds.find((n) => n.id === noeudId)!;
          return [
            `${roadmapId}/${noeudId}`,
            { noeud: heuresEstimees([noeud], h), bloc: noeud.bloc, heuresBloc: heuresEstimees(roadmap.noeuds.filter((n) => n.bloc === noeud.bloc), h) },
          ] as const;
        }),
      ),
    ),
  };
  /** Rôles du projet sans roadmap : leur page « rôle » est la destination du quiz. */
  const rolesSansParcours = Object.fromEntries((projets[0]?.roles ?? []).filter((r) => !r.roadmap).map((r) => [r.id, r.libelle]));
  /** Blocs qu'on peut tester (assez de questions) : le résultat du quiz propose d'en tester un. */
  const testables = blocsTestables(roadmaps).map(({ roadmapId, bloc, slug }) => ({ roadmapId, bloc, slug }));
  return { config, parcours, titresNoeuds, projets: projetsPourAssistant, durees, rolesSansParcours, testables };
}
