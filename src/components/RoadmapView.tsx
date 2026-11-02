"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { suivre } from "@/produits/mesure";
import { cheminConseille } from "@/lib/chemin";
import { LIBELLE_NIVEAU } from "@/lib/libelles";
import type { Roadmap } from "@/lib/schema";
import { PASTILLE_NIVEAU } from "@/lib/styles";
import { estLienEtat, useDues, useProgression } from "@/produits/progression";
import { useVisiteur } from "@/produits/visiteur";
import type { InfoVideo } from "@/lib/formatVideo";
import AncreParcours from "./AncreParcours";
import { Liste } from "@/produits/liste";
import PanneauProgression from "./PanneauProgression";
import PresentationVideo from "./PresentationVideo";
import TiroirNoeud from "./TiroirNoeud";

// Les trois vues graphiques embarquent React Flow : chargées à la demande, elles ne pèsent pas sur l'affichage initial (liste, bloc « Commencer ici »).
const CarteMetro = dynamic(() => import("@/produits/metro").then((m) => m.CarteMetro));
const GrapheRoadmap = dynamic(() => import("@/produits/arbre").then((m) => m.GrapheRoadmap));
const VueObjectif = dynamic(() => import("@/produits/objectif").then((m) => m.VueObjectif));

const REQUETE_BUREAU = "(min-width: 768px)";

function useEcranLarge(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(REQUETE_BUREAU);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(REQUETE_BUREAU).matches,
    () => false,
  );
}

export default function RoadmapView({ roadmap, video, projetId, entete }: { roadmap: Roadmap; video: InfoVideo | null; projetId?: string; /** Rendu serveur sous le titre (origine de la roadmap). */ entete?: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const large = useEcranLarge();
  const [cheminActif, setCheminActif] = useState(false);
  const chemin = useMemo(() => (cheminActif ? cheminConseille(roadmap) : null), [cheminActif, roadmap]);
  const { progression, decompte, suivi, monParcours, suivreCeParcours, definirStatut, remplacer, reinitialiser, migration, marquerMigrationLue } = useProgression(roadmap);
  useEffect(() => suivre("roadmap_open", { roadmap: roadmap.id }), [roadmap.id]);
  const dues = useDues();
  const visiteur = useVisiteur();
  // Un lien de sauvegarde complet (?etat=p1.…) se traite dans « Mon espace ».
  const lienComplet = params.get("etat");
  useEffect(() => {
    if (estLienEtat(lienComplet)) router.replace(`/moi?etat=${lienComplet}`);
  }, [lienComplet, router]);

  const existe = (id: string | null) => (id && roadmap.noeuds.some((n) => n.id === id) ? id : null);
  const selection = existe(params.get("noeud"));
  const cibleId = existe(params.get("cible"));
  const vue = params.get("vue");
  const vueObjectif = vue === "objectif";
  // Le plan de métro est une carte large : sur mobile, la liste par bloc joue le même rôle.
  const vueMetro = vue === "metro" && large;
  // La liste par bloc est l'alternative textuelle, accessible au clavier et aux lecteurs d'écran, à l'arbre et au métro.
  const vueListe = vue === "liste" || !large;

  /** Met à jour l'URL (état partagé et bouton retour) en gardant les autres paramètres. */
  const majUrl = useCallback(
    (patch: Record<string, string | null>) => {
      const qs = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null) qs.delete(k);
        else qs.set(k, v);
      }
      const texte = qs.toString();
      router.push(texte ? `${pathname}?${texte}` : pathname, { scroll: false });
    },
    [params, router, pathname],
  );

  const ouvrir = useCallback((id: string) => majUrl({ noeud: id }), [majUrl]);
  const fermer = useCallback(() => majUrl({ noeud: null }), [majUrl]);
  const choisirVue = (v: "objectif" | "metro" | "liste" | null) => majUrl({ vue: v, noeud: null });
  const choisirCible = useCallback((id: string | null) => majUrl({ vue: "objectif", cible: id, noeud: null }), [majUrl]);

  const noeudOuvert = roadmap.noeuds.find((n) => n.id === selection);
  const aDemande = roadmap.noeuds.some((n) => n.demande === "forte");

  const onglet =
    "bouton";

  return (
    <div className="flex flex-col">
      <div className="px-4 pb-2 pt-2">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <h1 className="text-xl font-bold">{roadmap.titre}</h1>
            {entete}
          </div>
          {monParcours ? (
            <span className="text-xs font-bold">● Mon parcours</span>
          ) : (
            <button type="button" className="bouton !py-1 !text-xs" onClick={suivreCeParcours}>
              Suivre ce parcours
            </button>
          )}
        </div>
      </div>

      <AncreParcours roadmap={roadmap} progression={progression} decompte={decompte} monParcours={monParcours} dues={dues} projetId={projetId} aide={visiteur !== "revenant" && roadmap.type === "role"} onOuvrir={ouvrir} />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b px-4 py-2" style={{ borderColor: "var(--filet)" }}>
        <div role="group" aria-label="Vue" className="flex gap-2">
          <button type="button" aria-pressed={!vueObjectif && !vueMetro && (!large || vue !== "liste")} onClick={() => choisirVue(null)} className={onglet}>
            {large ? "Arbre" : "Liste"}
          </button>
          {large && (
            <button type="button" aria-pressed={vue === "liste"} onClick={() => choisirVue("liste")} className={onglet}>
              Liste
            </button>
          )}
          {large && (
            <button type="button" aria-pressed={vueMetro} onClick={() => choisirVue("metro")} className={onglet}>
              Métro
            </button>
          )}
          <button type="button" aria-pressed={vueObjectif} onClick={() => choisirVue("objectif")} className={onglet}>
            ⚑ Objectif
          </button>
        </div>
        <details className="min-w-0 text-sm open:basis-full">
          <summary className="cursor-pointer select-none py-1 font-semibold">Options{cheminActif ? " · chemin conseillé actif" : ""}</summary>
          <div className="mt-2 space-y-3">
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-700 dark:text-slate-300" aria-label="Légende des niveaux">
              {(Object.keys(LIBELLE_NIVEAU) as (keyof typeof LIBELLE_NIVEAU)[]).map((k) => (
                <li key={k} className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${PASTILLE_NIVEAU[k]}`} />
                  {LIBELLE_NIVEAU[k]}
                </li>
              ))}
            </ul>
            {!vueObjectif && aDemande && (
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" aria-pressed={cheminActif} onClick={() => setCheminActif((v) => !v)} className={onglet}>
                  ★ Chemin conseillé
                </button>
                {chemin && (
                  <span className="text-xs text-slate-700 dark:text-slate-300">
                    {chemin.size} nœuds sur {roadmap.noeuds.length} : forte demande et leurs prérequis.
                  </span>
                )}
              </div>
            )}
            {video && <PresentationVideo video={video} presentation={roadmap.presentation} titre={roadmap.titre} />}
          </div>
        </details>
        <PanneauProgression
          roadmap={roadmap}
          progression={progression}
          onRemplacer={remplacer}
          onReinitialiser={reinitialiser}
          decompte={decompte}
          migration={migration}
          onMigrationLue={marquerMigrationLue}
          etatPartage={estLienEtat(lienComplet) ? null : lienComplet}
          onEtatTraite={() => majUrl({ etat: null })}
        />
      </div>

      {vueObjectif ? (
        <VueObjectif
          roadmap={roadmap}
          cibleId={cibleId}
          progression={progression}
          selection={selection}
          large={large}
          onOuvrir={ouvrir}
          onChoisirCible={choisirCible}
        />
      ) : vueMetro ? (
        <div className="h-[calc(100dvh-14rem)] min-h-[480px]">
          <CarteMetro roadmap={roadmap} selection={selection} progression={progression} chemin={chemin} onOuvrir={ouvrir} />
        </div>
      ) : !vueListe ? (
        <div className="h-[calc(100dvh-14rem)] min-h-[480px]">
          <GrapheRoadmap roadmap={roadmap} selection={selection} progression={progression} chemin={chemin} onOuvrir={ouvrir} />
        </div>
      ) : (
        <Liste roadmap={roadmap} selection={selection} progression={progression} chemin={chemin} onOuvrir={ouvrir} />
      )}
      {noeudOuvert && (
        <TiroirNoeud
          roadmap={roadmap}
          noeud={noeudOuvert}
          modal={!large}
          suivi={suivi(noeudOuvert.id)}
          onStatut={definirStatut}
          estObjectif={vueObjectif && cibleId === noeudOuvert.id}
          onObjectif={() => choisirCible(noeudOuvert.id)}
          onOuvrir={ouvrir}
          onFermer={fermer}
        />
      )}
    </div>
  );
}
