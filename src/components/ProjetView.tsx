"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { LIBELLE_NIVEAU, LIBELLE_STATUT } from "@/lib/libelles";
import type { CompetenceResolue, PhaseResolue, ProjetResolu } from "@/lib/projet-schema";
import { statutDe, type Statut } from "@/produits/progression";
import type { Roadmap } from "@/lib/schema";
import { PASTILLE_NIVEAU } from "@/lib/styles";
import { useProgression } from "@/produits/progression";
import { urlNoeud, urlProjet, urlRoadmap } from "@/lib/urls";

/** Roadmap factice : permet d'appeler le hook de progression quand aucun rôle n'est choisi. */
const AUCUNE = { id: "aucune", noeuds: [] } as unknown as Roadmap;

type Etat = Statut | "hors" | null;

const STYLE_COMPETENCE: Record<NonNullable<Etat> | "neutre", string> = {
  neutre: "border-black dark:border-white",
  "a-faire": "border-black dark:border-white",
  "en-cours": "border-black bg-brand-cyan text-black",
  maitrise: "border-brand-green bg-brand-green text-white dark:border-brand-green-light dark:bg-brand-green-light dark:text-black",
  ignore: "border-slate-400 text-slate-500 line-through",
  hors: "border-dashed border-slate-500 text-slate-600 dark:text-slate-300",
};

function Competence({ c, etat }: { c: CompetenceResolue; etat: Etat }) {
  const marque = etat === "maitrise" ? "✓ " : etat === "en-cours" ? "◐ " : etat === "hors" ? "↗ " : "";
  const precision = etat === "hors" ? "hors de la roadmap de votre rôle" : etat ? LIBELLE_STATUT[etat].toLowerCase() : "";
  return (
    <Link
      href={urlNoeud(c.roadmap, c.noeud)}
      title={`${c.titre} · ${LIBELLE_NIVEAU[c.niveau]} · roadmap « ${c.roadmapTitre} »`}
      aria-label={`${c.titre}, ${LIBELLE_NIVEAU[c.niveau].toLowerCase()}${precision ? `, ${precision}` : ""}`}
      className={`inline-flex items-center gap-1.5 border px-2 py-1 text-xs hover:bg-orange hover:text-black ${STYLE_COMPETENCE[etat ?? "neutre"]}`}
    >
      <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${PASTILLE_NIVEAU[c.niveau]}`} />
      <span>
        {marque}
        {c.titre}
      </span>
    </Link>
  );
}

export default function ProjetView({
  projet,
  roadmapsDesRoles,
}: {
  projet: ProjetResolu;
  roadmapsDesRoles: Record<string, Roadmap>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const roleId = params.get("role");
  const role = projet.roles.find((r) => r.id === roleId);
  const roadmapRole = role?.roadmap ? roadmapsDesRoles[role.roadmap] : undefined;
  const { progression } = useProgression(roadmapRole ?? AUCUNE);

  const choisirRole = (id: string | null) => router.replace(id ? `${pathname}?role=${id}` : pathname, { scroll: false });

  const idsRoadmapRole = useMemo(() => new Set(roadmapRole?.noeuds.map((n) => n.id)), [roadmapRole]);
  const etatDe = (c: CompetenceResolue): Etat => {
    if (!roadmapRole) return null;
    return idsRoadmapRole.has(c.noeud) ? statutDe(progression, c.noeud) : "hors";
  };

  /** Pour le rôle choisi : activités, compétences et préparation, phase par phase. */
  const parPhase = useMemo(() => {
    if (!role) return null;
    return projet.phases.map((phase) => {
      const activites = phase.activites.filter((a) => a.roles.includes(role.id));
      const competences = new Map<string, CompetenceResolue>();
      for (const a of activites) for (const c of a.competences) competences.set(c.noeud, c);
      const etats = [...competences.values()].map((c) => ({ c, etat: etatDe(c) }));
      const evaluables = etats.filter((e) => e.etat !== "hors" && e.etat !== "ignore" && e.etat !== null);
      return {
        id: phase.id,
        activites: activites.length,
        competences: etats.length,
        total: evaluables.length,
        maitrisees: evaluables.filter((e) => e.etat === "maitrise").length,
        hors: etats.filter((e) => e.etat === "hors").length,
      };
    });
    // etatDe dépend de roadmapRole et de la progression
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, projet, roadmapRole, progression, idsRoadmapRole]);

  const bilan = useMemo(() => {
    if (!role || !parPhase) return null;
    const distinctes = new Map<string, { etat: Etat }>();
    for (const phase of projet.phases)
      for (const a of phase.activites)
        if (a.roles.includes(role.id)) for (const c of a.competences) distinctes.set(c.noeud, { etat: etatDe(c) });
    const etats = [...distinctes.values()].map((x) => x.etat);
    const evaluables = etats.filter((e) => e !== "hors" && e !== "ignore" && e !== null);
    const maitrisees = evaluables.filter((e) => e === "maitrise").length;
    const priorite = parPhase
      .map((p, i) => ({ i, manque: p.total - p.maitrisees }))
      .filter((p) => p.manque > 0)
      .sort((a, b) => b.manque - a.manque)[0];
    return {
      activites: parPhase.reduce((s, p) => s + p.activites, 0),
      phases: parPhase.filter((p) => p.activites > 0).length,
      competences: distinctes.size,
      evaluables: evaluables.length,
      maitrisees,
      pourcentage: evaluables.length ? Math.round((maitrisees / evaluables.length) * 100) : 0,
      hors: etats.filter((e) => e === "hors").length,
      priorite: priorite ? projet.phases[priorite.i] : null,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, parPhase, projet, roadmapRole, progression, idsRoadmapRole]);

  const nbActivites = (roleIdentifiant: string, phase: PhaseResolue) =>
    phase.activites.filter((a) => a.roles.includes(roleIdentifiant)).length;
  const libelleRole = (id: string) => projet.roles.find((r) => r.id === id)?.libelle ?? id;

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6">
      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Projet fil rouge · version {projet.version}</p>
        <h1 className="text-2xl font-bold sm:text-3xl">{projet.titre}</h1>
        <p className="max-w-3xl text-lg">{projet.resume}</p>
        <Link href={urlProjet(projet.id, true)} className="bouton inline-block">
          Ouvrir la carte interactive →
        </Link>
        <p className="max-w-3xl border-l-4 border-orange bg-slate-100 p-3 text-sm dark:bg-slate-900">
          <strong>Hypothèses. </strong>
          {projet.contexte}
        </p>
      </header>

      <section aria-labelledby="titre-role" className="space-y-3">
        <h2 id="titre-role" className="text-xl font-bold">
          Votre rôle
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Choisissez un rôle pour voir ses activités, les compétences attendues à chaque phase et, d&apos;après votre progression
          enregistrée sur ce navigateur, ce qu&apos;il vous reste à acquérir.
        </p>
        <div role="group" aria-label="Rôle" className="flex flex-wrap gap-2">
          <button type="button" className="bouton" aria-pressed={!role} onClick={() => choisirRole(null)}>
            Vue d&apos;ensemble
          </button>
          {projet.roles.map((r) => (
            <button key={r.id} type="button" className="bouton" aria-pressed={role?.id === r.id} onClick={() => choisirRole(r.id)}>
              {r.libelle}
            </button>
          ))}
        </div>

        {role && bilan && (
          <div className="space-y-2 border-2 border-black p-4 dark:border-white" aria-live="polite">
            <p className="font-bold">{role.libelle}</p>
            <p className="text-sm">{role.description}</p>
            <p className="text-sm">
              Il intervient dans <strong>{bilan.activites} activités</strong> sur <strong>{bilan.phases} phases</strong> et mobilise{" "}
              <strong>{bilan.competences} compétences</strong>.
            </p>
            {roadmapRole ? (
              <>
                <p className="text-sm">
                  Dans votre progression sur « {roadmapRole.titre} » : <strong>{bilan.maitrisees}/{bilan.evaluables} acquises (testé) ({bilan.pourcentage} %)</strong>.
                  {bilan.priorite && (
                    <>
                      {" "}
                      Priorité : la phase « <a href={`#phase-${bilan.priorite.id}`} className="underline decoration-orange decoration-2 underline-offset-4">{bilan.priorite.titre}</a> ».
                    </>
                  )}
                </p>
                {bilan.hors > 0 && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {bilan.hors} compétence{bilan.hors > 1 ? "s" : ""} utile{bilan.hors > 1 ? "s" : ""} à ce projet ne figure{bilan.hors > 1 ? "nt" : ""} pas
                    dans la roadmap de ce rôle (marquées ↗) : un écart à signaler dans votre parcours.
                  </p>
                )}
                <p className="text-sm">
                  <Link href={urlRoadmap(roadmapRole.id)} className="font-semibold underline decoration-orange decoration-2 underline-offset-4 hover:bg-orange hover:text-black">
                    Ouvrir la roadmap du rôle ↗
                  </Link>
                </p>
                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400" aria-label="Légende">
                  <li>✓ acquise (testé)</li>
                  <li>◐ en cours</li>
                  <li>↗ hors de la roadmap du rôle</li>
                </ul>
              </>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Ce rôle n&apos;a pas de roadmap sur le site : les compétences listées sont celles qu&apos;on attend de lui, à rapprocher des
                roadmaps des autres rôles.
              </p>
            )}
          </div>
        )}
      </section>

      <section aria-labelledby="titre-matrice" className="space-y-3">
        <h2 id="titre-matrice" className="text-xl font-bold">
          Qui intervient à chaque phase
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Nombre d&apos;activités par rôle et par phase</caption>
            <thead>
              <tr>
                <th scope="col" className="border border-black p-2 text-left dark:border-white">
                  Rôle
                </th>
                {projet.phases.map((p, i) => (
                  <th key={p.id} scope="col" className="border border-black p-2 text-center dark:border-white">
                    <a href={`#phase-${p.id}`} title={p.titre} className="font-bold underline decoration-orange decoration-2 underline-offset-4">
                      {i + 1}
                    </a>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projet.roles.map((r) => (
                <tr key={r.id} className={role?.id === r.id ? "bg-orange text-black" : ""}>
                  <th scope="row" className="border border-black p-2 text-left font-medium dark:border-white">
                    <button type="button" onClick={() => choisirRole(role?.id === r.id ? null : r.id)} className="text-left underline-offset-4 hover:underline">
                      {r.libelle}
                    </button>
                  </th>
                  {projet.phases.map((p) => {
                    const n = nbActivites(r.id, p);
                    return (
                      <td key={p.id} className="border border-black p-2 text-center dark:border-white" title={`${r.libelle} · ${p.titre} : ${n} activité${n > 1 ? "s" : ""}`}>
                        {n > 0 ? <span className="font-bold">{n}</span> : <span aria-label="aucune activité" className="text-slate-400">·</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500">Les numéros de colonne renvoient aux phases ci-dessous ; le chiffre est le nombre d&apos;activités du rôle dans la phase.</p>
      </section>

      <ol className="space-y-10">
        {projet.phases.map((phase, i) => {
          const stats = parPhase?.[i];
          const mesActivites = role ? phase.activites.filter((a) => a.roles.includes(role.id)) : phase.activites;
          const autres = role ? phase.activites.filter((a) => !a.roles.includes(role.id)) : [];
          const carte = (a: (typeof phase.activites)[number]) => (
            <li key={a.titre} className="space-y-2 border border-slate-300 p-3 dark:border-slate-700">
              <p className="font-bold">{a.titre}</p>
              <p className="flex flex-wrap gap-1.5 text-xs">
                <span className="text-slate-500">Rôles :</span>
                {a.roles.map((id) => (
                  <span key={id} className={`border px-1.5 py-0.5 ${id === role?.id ? "border-orange bg-orange font-bold text-black" : "border-slate-400"}`}>
                    {libelleRole(id)}
                  </span>
                ))}
              </p>
              {a.competences.length > 0 && (
                <ul className="flex flex-wrap gap-1.5" aria-label="Compétences">
                  {a.competences.map((c) => (
                    <li key={`${c.roadmap}/${c.noeud}`}>
                      <Competence c={c} etat={role ? etatDe(c) : null} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
          return (
            <li key={phase.id} id={`phase-${phase.id}`} className="scroll-mt-4 space-y-4">
              <div className="flex items-start gap-4">
                <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center bg-orange text-2xl font-bold text-black">
                  {i + 1}
                </span>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold">
                    <span className="sr-only">Phase {i + 1} : </span>
                    {phase.titre}
                  </h2>
                  <p>{phase.objectif}</p>
                </div>
              </div>

              {role && stats && roadmapRole && stats.total > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Votre préparation à cette phase</span>
                    <span>
                      {stats.maitrisees}/{stats.total} compétences acquises (testé)
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`Préparation à la phase ${phase.titre}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round((stats.maitrisees / stats.total) * 100)}
                    className="h-2 w-full overflow-hidden bg-slate-200 dark:bg-slate-700"
                  >
                    <div className="h-full bg-orange" style={{ width: `${(stats.maitrisees / stats.total) * 100}%` }} />
                  </div>
                </div>
              )}

              <div className="grid gap-4 lg:grid-cols-3">
                <section aria-label="Livrables" className="border border-slate-300 p-3 dark:border-slate-700">
                  <h3 className="mb-1 text-sm font-bold">Livrables</h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    {phase.livrables.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                </section>
                <section aria-label="Jalon" className="border-2 border-orange p-3">
                  <h3 className="mb-1 text-sm font-bold">Jalon : {phase.jalon.titre}</h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    {phase.jalon.criteres.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </section>
                <section aria-label="Risques" className="border border-slate-300 p-3 dark:border-slate-700">
                  <h3 className="mb-1 text-sm font-bold">Risques fréquents</h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    {phase.risques.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </section>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold">{role ? `Vos activités (${mesActivites.length})` : `Activités (${mesActivites.length})`}</h3>
                {role && mesActivites.length === 0 && <p className="text-sm text-slate-500">{role.libelle} n&apos;intervient pas directement dans cette phase.</p>}
                <ul className="space-y-3">{mesActivites.map(carte)}</ul>
                {autres.length > 0 && (
                  <details className="text-sm">
                    <summary className="cursor-pointer select-none py-1 font-medium">Autres activités de la phase ({autres.length})</summary>
                    <ul className="mt-2 space-y-3">{autres.map(carte)}</ul>
                  </details>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <p className="border-t border-slate-300 pt-4 text-xs text-slate-500 dark:border-slate-700">{projet.source}</p>
    </main>
  );
}
