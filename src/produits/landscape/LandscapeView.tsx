"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { usageParRoles } from "./schema";
import { normaliser } from "@/produits/recherche";
import type { LandscapeResolu, OutilResolu } from "./chargement";
import { urlNoeud } from "@/lib/urls";
import LogoOutil from "./LogoOutil";

type Vue = "landscape" | "parcours";

const statutCncf = { graduated: "CNCF graduated", incubating: "CNCF incubating", sandbox: "CNCF sandbox" } as const;

/** Réécrit l'adresse sans navigation : la sélection se partage par lien, sans recharger les données. */
function ecrireAdresse(roles: string[], vue: Vue, outil: string | null) {
  const p = new URLSearchParams();
  if (roles.length) p.set("roles", roles.join(","));
  if (vue !== "landscape") p.set("vue", vue);
  if (outil) p.set("outil", outil);
  const q = p.toString();
  window.history.replaceState(null, "", q ? `?${q}` : window.location.pathname);
}

export default function LandscapeView({ landscape }: { landscape: LandscapeResolu }) {
  const params = useSearchParams();
  const idsRoles = useMemo(() => new Set(landscape.roles.map((r) => r.id)), [landscape.roles]);
  const [roles, setRoles] = useState<string[]>(() => (params.get("roles") ?? "").split(",").filter((r) => idsRoles.has(r)));
  const [vue, setVue] = useState<Vue>(params.get("vue") === "parcours" ? "parcours" : "landscape");
  const [masquer, setMasquer] = useState(false);
  const [outilId, setOutilId] = useState<string | null>(() => {
    const id = params.get("outil");
    return landscape.outils.some((o) => o.id === id) ? id : null;
  });
  const [etape, setEtape] = useState(0);
  const [filtre, setFiltre] = useState("");
  const q = normaliser(filtre.trim());
  const correspond = (o: OutilResolu) => !q || normaliser(o.nom).includes(q);

  const maj = (r: string[], v: Vue, o: string | null) => {
    setRoles(r);
    setVue(v);
    setOutilId(o);
    setEtape(0);
    ecrireAdresse(r, v, o);
  };
  const basculerRole = (id: string) => maj(roles.includes(id) ? roles.filter((r) => r !== id) : [...roles, id], vue, outilId);

  const libelles = new Map(landscape.roles.map((r) => [r.id, r.libelle]));
  const dansLaPile = (o: OutilResolu) => usageParRoles(o, roles) > 0;
  const outilsPile = landscape.outils.filter(dansLaPile);
  const communs = roles.length > 1 ? landscape.outils.filter((o) => usageParRoles(o, roles) === roles.length) : [];
  const outil = landscape.outils.find((o) => o.id === outilId) ?? null;

  const categoriesActives = landscape.categories.filter((c) => outilsPile.some((o) => o.categorie === c.id));
  const etapeCourante = Math.min(etape, Math.max(categoriesActives.length - 1, 0));
  const categorieEtape = categoriesActives[etapeCourante];

  return (
    <div className="space-y-6">
      <fieldset className="space-y-2">
        <legend className="text-sm font-bold">Pour quels rôles voulez-vous voir la pile ?</legend>
        <div className="flex flex-wrap gap-2">
          {landscape.roles.map((r) => {
            const actif = roles.includes(r.id);
            return (
              <button
                key={r.id}
                type="button"
                aria-pressed={actif}
                onClick={() => basculerRole(r.id)}
                className={`border px-3 py-1.5 text-sm ${actif ? "border-black bg-orange font-bold text-black" : "border-black hover:bg-slate-100 dark:border-white dark:hover:bg-slate-800"}`}
              >
                {actif && <span aria-hidden="true">✓ </span>}
                {r.libelle}
              </button>
            );
          })}
          {roles.length > 0 && (
            <button type="button" onClick={() => maj([], vue, outilId)} className="px-2 py-1.5 text-sm underline underline-offset-4 hover:no-underline">
              Tout afficher
            </button>
          )}
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300" aria-live="polite">
          {roles.length === 0
            ? `Aucun rôle choisi : les ${landscape.outils.length} outils sont affichés.`
            : `${outilsPile.length} outils sur ${landscape.outils.length} pour ${roles.map((r) => libelles.get(r)).join(" + ")}.`}
          {communs.length > 0 && <> Communs à tous ces rôles : {communs.map((o) => o.nom).join(", ")}.</>}
        </p>
      </fieldset>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div role="group" aria-label="Mode d'affichage" className="flex border border-black dark:border-white">
          {(["landscape", "parcours"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={vue === v}
              onClick={() => maj(roles, v, outilId)}
              className={`px-4 py-1.5 text-sm ${vue === v ? "bg-black font-bold text-white dark:bg-white dark:text-black" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}
            >
              {v === "landscape" ? "Landscape" : "Parcours guidé"}
            </button>
          ))}
        </div>
        {vue === "landscape" && (
          <label className="flex items-center gap-2 text-sm">
            <span className="sr-only">Filtrer les outils</span>
            <input
              type="search"
              value={filtre}
              onChange={(e) => setFiltre(e.target.value)}
              placeholder="Filtrer les outils…"
              className="w-56 rounded-full border border-slate-400 bg-transparent px-3 py-1.5"
            />
          </label>
        )}
        {vue === "landscape" && roles.length > 0 && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={masquer} onChange={(e) => setMasquer(e.target.checked)} />
            Masquer les outils hors pile
          </label>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div>
          {vue === "landscape" ? (
            <div className="xl:grid xl:grid-cols-[12rem_1fr] xl:gap-6">
            <nav aria-label="Catégories" className="mb-4 hidden xl:sticky xl:top-20 xl:mb-0 xl:block xl:self-start">
              <ul className="m-0 list-none space-y-0.5 p-0 text-sm">
                {landscape.categories.map((c) => {
                  const total = landscape.outils.filter((o) => o.categorie === c.id);
                  const n = total.filter(dansLaPile).length;
                  return (
                    <li key={c.id}>
                      <a href={`#cat-${c.id}`} className="flex justify-between gap-2 rounded-lg px-2 py-1.5 no-underline hover:bg-slate-100 dark:hover:bg-slate-800">
                        {c.libelle}
                        <span className="text-xs text-slate-600 dark:text-slate-400">{roles.length ? `${n}/${total.length}` : total.length}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="space-y-5">
              {landscape.categories.map((c) => {
                const outilsCat = landscape.outils.filter((o) => o.categorie === c.id);
                const n = outilsCat.filter(dansLaPile).length;
                if ((masquer && n === 0) || (q && !outilsCat.some(correspond))) return null;
                return (
                  <section key={c.id} aria-labelledby={`cat-${c.id}`} className="border border-black p-3 dark:border-white">
                    <h2 id={`cat-${c.id}`} className="flex items-baseline justify-between gap-2 text-base font-bold">
                      {c.libelle}
                      <span className="text-xs font-normal text-slate-600 dark:text-slate-400">
                        {roles.length ? `${n} / ${outilsCat.length}` : outilsCat.length} outils
                      </span>
                    </h2>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {c.sous_categories.map((s) => {
                        const tuiles = outilsCat.filter((o) => o.sous_categorie === s.id && (!masquer || dansLaPile(o)) && correspond(o));
                        if (tuiles.length === 0) return null;
                        return (
                          <div key={s.id}>
                            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">{s.libelle}</h3>
                            <ul className="mt-1 flex flex-wrap gap-1.5">
                              {tuiles.map((o) => (
                                <li key={o.id}>
                                  <Tuile outil={o} roles={roles} choisi={o.id === outilId} onChoisir={() => maj(roles, vue, o.id === outilId ? null : o.id)} />
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
            </div>
          ) : categorieEtape ? (
            <div className="space-y-4">
              <ol className="flex flex-wrap gap-1.5" aria-label="Étapes du parcours">
                {categoriesActives.map((c, i) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      aria-current={i === etapeCourante ? "step" : undefined}
                      onClick={() => setEtape(i)}
                      className={`border px-2.5 py-1 text-xs ${i === etapeCourante ? "border-black bg-orange font-bold text-black" : "border-black hover:bg-slate-100 dark:border-white dark:hover:bg-slate-800"}`}
                    >
                      {i + 1}. {c.libelle}
                    </button>
                  </li>
                ))}
              </ol>
              <section className="border border-black p-4 dark:border-white">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Étape {etapeCourante + 1} sur {categoriesActives.length}
                </p>
                <h2 className="mt-1 text-xl font-bold">{categorieEtape.libelle}</h2>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{categorieEtape.intro}</p>
                {categorieEtape.sous_categories.map((s) => {
                  const liste = outilsPile.filter((o) => o.categorie === categorieEtape.id && o.sous_categorie === s.id);
                  if (liste.length === 0) return null;
                  return (
                    <div key={s.id} className="mt-4">
                      <h3 className="text-sm font-bold">{s.libelle}</h3>
                      <ul className="mt-1 space-y-2">
                        {liste.map((o) => (
                          <li key={o.id} className="text-sm">
                            <span className="mr-2 inline-block align-middle">
                              <LogoOutil nom={o.nom} logo={o.logo} taille={22} />
                            </span>
                            <a href={o.url} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-4 hover:no-underline">
                              {o.nom}
                            </a>
                            {o.cncf && <span className="ml-2 text-xs text-slate-600 dark:text-slate-400">{statutCncf[o.cncf]}</span>}
                            <span className="block text-slate-700 dark:text-slate-300">
                              {roles.length > 0 && <>Pour : {o.roles.filter((r) => roles.includes(r)).map((r) => libelles.get(r)).join(", ")}. </>}
                              {o.competences.length > 0 && (
                                <>
                                  À apprendre :{" "}
                                  {o.competences.map((c, i) => (
                                    <span key={c.noeud}>
                                      {i > 0 && ", "}
                                      <Link href={urlNoeud(c.roadmap, c.noeud)} className="underline underline-offset-4 hover:no-underline">
                                        {c.titre}
                                      </Link>
                                    </span>
                                  ))}
                                  .
                                </>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </section>
              <div className="flex justify-between">
                <button type="button" disabled={etapeCourante === 0} onClick={() => setEtape(etapeCourante - 1)} className="bouton disabled:opacity-40">
                  ← Précédent
                </button>
                <button
                  type="button"
                  disabled={etapeCourante === categoriesActives.length - 1}
                  onClick={() => setEtape(etapeCourante + 1)}
                  className="bouton !bg-orange !text-black disabled:opacity-40"
                >
                  Suivant →
                </button>
              </div>
            </div>
          ) : (
            <p>Aucun outil pour cette sélection.</p>
          )}
        </div>

        <aside aria-label="Détail de l'outil" className="lg:sticky lg:top-4 lg:self-start">
          {outil ? (
            <div className="border border-black p-4 dark:border-white">
              <div className="flex items-center gap-3">
                <LogoOutil nom={outil.nom} logo={outil.logo} taille={36} />
                <h2 className="text-lg font-bold">{outil.nom}</h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {landscape.categories.find((c) => c.id === outil.categorie)?.libelle}
                {outil.cncf && ` · ${statutCncf[outil.cncf]}`}
              </p>
              <a href={outil.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm underline underline-offset-4 hover:no-underline">
                Documentation ↗
              </a>
              <h3 className="mt-4 text-sm font-bold">Rôles qui l&apos;utilisent</h3>
              <ul className="mt-1 text-sm">
                {outil.roles.map((r) => (
                  <li key={r} className={roles.includes(r) ? "font-bold" : ""}>
                    {libelles.get(r)}
                    {roles.includes(r) && <span className="sr-only"> (sélectionné)</span>}
                  </li>
                ))}
              </ul>
              {outil.competences.length > 0 && (
                <>
                  <h3 className="mt-4 text-sm font-bold">Compétences associées</h3>
                  <ul className="mt-1 text-sm">
                    {outil.competences.map((c) => (
                      <li key={c.noeud}>
                        <Link href={urlNoeud(c.roadmap, c.noeud)} className="underline underline-offset-4 hover:no-underline">
                          {c.titre}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ) : (
            <p className="border border-dashed border-slate-400 p-4 text-sm text-slate-700 dark:text-slate-300">
              Choisissez un outil pour voir qui l&apos;utilise et quelles compétences y mènent.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

function Tuile({ outil, roles, choisi, onChoisir }: { outil: OutilResolu; roles: string[]; choisi: boolean; onChoisir: () => void }) {
  const usage = usageParRoles(outil, roles);
  const filtre = roles.length > 0;
  const horsPile = filtre && usage === 0;
  return (
    <button
      type="button"
      aria-pressed={choisi}
      onClick={onChoisir}
      className={`border px-2 py-1 text-left text-sm ${horsPile ? "border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400" : "border-black dark:border-white"} ${filtre && !horsPile ? "bg-orange/20 font-semibold" : ""} ${choisi ? "outline outline-2 outline-offset-1 outline-orange" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}
    >
      <span className="inline-flex items-center gap-1.5 align-middle">
        <LogoOutil nom={outil.nom} logo={outil.logo} taille={18} />
        {outil.nom}
      </span>
      {filtre && (
        <span className="ml-1.5 text-xs font-normal">
          {horsPile ? <span className="sr-only">hors pile</span> : `${usage}/${roles.length}`}
        </span>
      )}
    </button>
  );
}
