"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { formaterSelection, indexer, liensDe, parserSelection, type Selection, type TypeEntite } from "@/lib/carte";
import { amorce, construireGraphe } from "@/lib/graphe";
import type { ProjetResolu } from "@/lib/projet-schema";
import { statutDe } from "@/produits/progression";
import type { RessourceApprentissage } from "@/lib/projets";
import type { Roadmap } from "@/lib/schema";
import { useProgression } from "@/produits/progression";
import PanneauDetail from "./PanneauDetail";
import type { Ctx, EtatCompetence } from "./types";
import VueCouloirs from "./VueCouloirs";
import VueFlux from "./VueFlux";
import VueGraphe from "./VueGraphe";
import VueMatrice from "./VueMatrice";
import { urlProjet } from "@/lib/urls";

const AUCUNE = { id: "aucune", noeuds: [] } as unknown as Roadmap;

const VUES = [
  { id: "graphe", libelle: "Graphe", aide: "Explorer le graphe par perspective de rôle" },
  { id: "couloirs", libelle: "Couloirs", aide: "Qui fait quoi, phase par phase, avec les jalons" },
  { id: "flux", libelle: "Flux", aide: "Où va l'effort : rôles, phases, domaines" },
  { id: "matrice", libelle: "Matrice", aide: "Quelle compétence à quelle phase" },
] as const;

/** Carte interactive : trois vues coordonnées (couloirs, flux, matrice) autour d'une sélection unique. */
export default function CarteProjet({
  projet,
  roadmapsDesRoles,
  apprentissage,
}: {
  projet: ProjetResolu;
  roadmapsDesRoles: Record<string, Roadmap>;
  apprentissage: Record<string, RessourceApprentissage[]>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const index = useMemo(() => indexer(projet), [projet]);

  const vue = VUES.find((v) => v.id === params.get("vue"))?.id ?? "graphe";

  // Sélection issue de l'URL, ignorée si elle ne correspond à rien du projet.
  const brut = parserSelection(params.get("sel"));
  const sel: Selection =
    brut &&
    ((brut.type === "role" && index.roles.includes(brut.id)) ||
      ((brut.type === "phase" || brut.type === "jalon") && index.phases.includes(brut.id)) ||
      (brut.type === "competence" && index.competences.has(brut.id)) ||
      (brut.type === "activite" && index.activites.some((a) => a.id === brut.id)))
      ? brut
      : null;

  const profilRole = projet.roles.find((r) => r.id === params.get("role"));
  const roadmapRole = profilRole?.roadmap ? roadmapsDesRoles[profilRole.roadmap] : undefined;
  const { progression } = useProgression(roadmapRole ?? AUCUNE);
  const idsRoadmap = useMemo(() => new Set(roadmapRole?.noeuds.map((n) => n.id)), [roadmapRole]);

  const maj = useCallback(
    (patch: Record<string, string | null>) => {
      const qs = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null) qs.delete(k);
        else qs.set(k, v);
      }
      const texte = qs.toString();
      router.replace(texte ? `${pathname}?${texte}` : pathname, { scroll: false });
    },
    [params, router, pathname],
  );

  const liens = useMemo(() => liensDe(index, sel), [index, sel]);

  // Graphe : une scène par perspective (le rôle choisi), conservée quand on change de vue.
  const graphe = useMemo(() => construireGraphe(projet, index), [projet, index]);
  const cleScene = profilRole?.id ?? "ensemble";
  const depart = useMemo(() => amorce(index, profilRole?.id ?? null), [index, profilRole?.id]);
  const [scenes, setScenes] = useState<Record<string, string[]>>({});
  const scene = {
    visibles: scenes[cleScene] ?? depart,
    ajouter: (ids: string[]) => setScenes((p) => ({ ...p, [cleScene]: [...new Set([...(p[cleScene] ?? depart), ...ids])] })),
    retirer: (id: string) => setScenes((p) => ({ ...p, [cleScene]: (p[cleScene] ?? depart).filter((x) => x !== id) })),
    reinitialiser: () =>
      setScenes((p) => {
        const reste = { ...p };
        delete reste[cleScene];
        return reste;
      }),
  };

  const etatCompetence = (id: string): EtatCompetence => (roadmapRole ? (idsRoadmap.has(id) ? statutDe(progression, id) : "hors") : null);

  const ctx: Ctx = {
    projet,
    index,
    sel,
    liens,
    apprentissage,
    choisir: (s) => maj({ sel: s && sel && s.type === sel.type && s.id === sel.id ? null : formaterSelection(s) }),
    actif: (type: TypeEntite, id: string) => {
      if (!liens) return true;
      const ensemble = { role: liens.roles, phase: liens.phases, jalon: liens.jalons, competence: liens.competences, activite: liens.activites }[type];
      return ensemble.has(id);
    },
    estSel: (type, id) => sel?.type === type && sel.id === id,
    etatCompetence,
    profil: profilRole ? { id: profilRole.id, libelle: profilRole.libelle, roadmapId: profilRole.roadmap } : null,
    choisirProfil: (id) => maj({ role: id }),
    preparation: (competences) => {
      if (!roadmapRole) return null;
      const etats = competences.map(etatCompetence);
      const evaluables = etats.filter((e) => e !== "hors" && e !== "ignore" && e !== null);
      return { maitrisees: evaluables.filter((e) => e === "maitrise").length, evaluables: evaluables.length, hors: etats.filter((e) => e === "hors").length };
    },
  };

  const nomSelection = (() => {
    if (!sel) return null;
    if (sel.type === "role") return projet.roles.find((r) => r.id === sel.id)?.libelle;
    if (sel.type === "phase") return projet.phases.find((p) => p.id === sel.id)?.titre;
    if (sel.type === "jalon") return projet.phases.find((p) => p.id === sel.id)?.jalon.titre;
    if (sel.type === "competence") return index.competences.get(sel.id)?.titre;
    return index.activites.find((a) => a.id === sel.id)?.titre;
  })();

  return (
    <main className="mx-auto max-w-[1600px] space-y-4 p-4">
      <header className="space-y-1">
        <Link href={urlProjet(projet.id)} className="text-sm underline decoration-orange decoration-2 underline-offset-4 hover:bg-orange hover:text-black">
          ← Retour au projet
        </Link>
        <h1 className="text-2xl font-bold">Carte interactive : {projet.titre}</h1>
        <p className="max-w-4xl text-sm text-slate-600 dark:text-slate-400">
          Rôles, phases, jalons et compétences sur une seule carte. Dans le <strong>graphe</strong>, chaque perspective est le point de vue d&apos;un rôle sur le projet : explorez-le
          comme un graphe, en développant les voisins. Cliquez un élément dans n&apos;importe quelle vue : tout ce qui s&apos;y rattache s&apos;éclaire, le reste s&apos;estompe.
          L&apos;adresse de la page garde votre vue, votre perspective et votre sélection.
        </p>
      </header>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <div role="group" aria-label="Vue" className="flex flex-wrap gap-2">
          {VUES.map((v) => (
            <button key={v.id} type="button" title={v.aide} aria-pressed={vue === v.id} onClick={() => maj({ vue: v.id === "graphe" ? null : v.id })} className="bouton">
              {v.libelle}
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-1 text-xs font-bold">
          Perspective (rôle) : colore selon ma progression
          <select
            value={profilRole?.id ?? ""}
            onChange={(e) => maj({ role: e.target.value || null })}
            className="min-w-56 border-2 border-black bg-white px-2 py-1.5 text-sm font-normal dark:border-white dark:bg-slate-950"
          >
            <option value="">Vue d&apos;ensemble du projet</option>
            {projet.roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.libelle}
                {r.roadmap ? "" : " (sans roadmap)"}
              </option>
            ))}
          </select>
        </label>
        {sel && (
          <div className="flex items-center gap-2 text-sm" aria-live="polite">
            <span>
              Sélection : <strong>{nomSelection}</strong>
            </span>
            <button type="button" className="bouton !px-2 !py-1 !text-xs" onClick={() => maj({ sel: null })}>
              Tout afficher
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section aria-label="Carte" className="min-w-0">
          {vue === "graphe" && <VueGraphe ctx={ctx} graphe={graphe} scene={scene} />}
          {vue === "couloirs" && <VueCouloirs ctx={ctx} />}
          {vue === "flux" && <VueFlux ctx={ctx} />}
          {vue === "matrice" && <VueMatrice ctx={ctx} />}
        </section>
        <aside aria-label="Détail de la sélection" aria-live="polite" className="self-start border-2 border-black p-4 dark:border-white xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto">
          <PanneauDetail ctx={ctx} />
        </aside>
      </div>
    </main>
  );
}
