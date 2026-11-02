"use client";

import Link from "next/link";
import { LIBELLE_NIVEAU, LIBELLE_STATUT } from "@/lib/libelles";
import type { TypeEntite } from "@/lib/carte";
import { PASTILLE_NIVEAU } from "@/lib/styles";
import type { Ctx } from "./types";
import { urlNoeud, urlRoadmap } from "@/lib/urls";

function Puce({ ctx, type, id, libelle }: { ctx: Ctx; type: TypeEntite; id: string; libelle: string }) {
  return (
    <button type="button" onClick={() => ctx.choisir({ type, id })} className="puce !text-xs">
      {libelle}
    </button>
  );
}

function Liste({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1.5">
      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">{titre}</h3>
      {children}
    </section>
  );
}

function Preparation({ ctx, competences, libelle }: { ctx: Ctx; competences: string[]; libelle: string }) {
  const p = ctx.preparation(competences);
  if (!p || !ctx.profil) return null;
  const pct = p.evaluables ? Math.round((p.maitrisees / p.evaluables) * 100) : 0;
  return (
    <div className="space-y-1 border-2 border-black p-2 text-sm dark:border-white">
      <div className="flex justify-between gap-2">
        <span className="font-bold">{libelle}</span>
        <span>
          {p.maitrisees}/{p.evaluables}
        </span>
      </div>
      <div role="progressbar" aria-label={libelle} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="h-2 bg-slate-200 dark:bg-slate-700">
        <div className="h-full bg-orange" style={{ width: `${pct}%` }} />
      </div>
      {p.hors > 0 && <p className="text-xs text-slate-500">{p.hors} compétence{p.hors > 1 ? "s" : ""} hors de la roadmap de votre rôle (↗ dans la matrice).</p>}
    </div>
  );
}

export default function PanneauDetail({ ctx }: { ctx: Ctx }) {
  const { sel, projet, index, profil } = ctx;

  if (!sel)
    return (
      <div className="space-y-3 text-sm">
        <h2 className="text-lg font-bold">Explorer la carte</h2>
        <p>Cliquez un élément dans n&apos;importe quelle vue :</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>un <strong>rôle</strong> : ses activités, ses phases, ses compétences ;</li>
          <li>une <strong>phase</strong> : qui intervient, quoi acquérir ;</li>
          <li>un <strong>jalon ◆</strong> : tout ce qu&apos;il faut avoir couvert pour le franchir ;</li>
          <li>une <strong>compétence</strong> : où et par qui elle est mobilisée, et comment l&apos;apprendre.</li>
        </ul>
        <p className="text-slate-500">Le reste de la carte s&apos;estompe. Cliquez à nouveau pour désélectionner.</p>
      </div>
    );

  const numero = (phaseId: string) => index.phases.indexOf(phaseId) + 1;
  const titrePhase = (phaseId: string) => projet.phases.find((p) => p.id === phaseId)!.titre;
  const nomRole = (id: string) => projet.roles.find((r) => r.id === id)!.libelle;
  const nomComp = (id: string) => index.competences.get(id)!.titre;

  if (sel.type === "role") {
    const role = projet.roles.find((r) => r.id === sel.id)!;
    const acts = index.activites.filter((a) => a.roles.includes(role.id));
    const comps = [...new Set(acts.flatMap((a) => a.competences))];
    return (
      <div className="space-y-4 text-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Rôle</p>
          <h2 className="text-lg font-bold">{role.libelle}</h2>
          <p>{role.description}</p>
        </div>
        <p>
          <strong>{acts.length} activités</strong> sur <strong>{new Set(acts.map((a) => a.phase)).size} phases</strong>, <strong>{comps.length} compétences</strong>.
        </p>
        {profil?.id === role.id ? (
          <Preparation ctx={ctx} competences={comps} libelle="Votre préparation à ce rôle" />
        ) : role.roadmap ? (
          <button type="button" className="bouton !px-2 !py-1 !text-xs" onClick={() => ctx.choisirProfil(role.id)}>
            Me placer dans ce rôle (voir ma préparation)
          </button>
        ) : null}
        {projet.phases.map((p) => {
          const liste = acts.filter((a) => a.phase === p.id);
          return (
            liste.length > 0 && (
              <Liste key={p.id} titre={`Phase ${numero(p.id)} · ${p.titre}`}>
                <ul className="space-y-1">
                  {liste.map((a) => (
                    <li key={a.id}>
                      <Puce ctx={ctx} type="activite" id={a.id} libelle={a.titre} />
                    </li>
                  ))}
                </ul>
              </Liste>
            )
          );
        })}
        {role.roadmap ? (
          <Link href={urlRoadmap(role.roadmap)} className="inline-block font-semibold underline decoration-orange decoration-2 underline-offset-4 hover:bg-orange hover:text-black">
            Ouvrir la roadmap de ce rôle ↗
          </Link>
        ) : null}
      </div>
    );
  }

  if (sel.type === "phase" || sel.type === "jalon") {
    const k = index.phases.indexOf(sel.id);
    const phase = projet.phases[k];
    const jalon = sel.type === "jalon";
    const acts = index.activites.filter((a) => (jalon ? a.indexPhase <= k : a.indexPhase === k));
    const comps = [...new Set(acts.flatMap((a) => a.competences))];
    const nouvelles = [...index.competences.values()].filter((c) => c.premierePhase === k);
    const rolesImpliques = [...new Set(acts.flatMap((a) => a.roles))];
    const compsProfil = profil ? [...new Set(acts.filter((a) => a.roles.includes(profil.id)).flatMap((a) => a.competences))] : [];
    return (
      <div className="space-y-4 text-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{jalon ? `Jalon de la phase ${k + 1}` : `Phase ${k + 1}`}</p>
          <h2 className="text-lg font-bold">{jalon ? `◆ ${phase.jalon.titre}` : phase.titre}</h2>
          <p>{jalon ? `À l'issue de la phase « ${phase.titre} ».` : phase.objectif}</p>
        </div>
        <Liste titre={jalon ? "Critères de passage" : "Jalon de sortie"}>
          {!jalon && <Puce ctx={ctx} type="jalon" id={phase.id} libelle={`◆ ${phase.jalon.titre}`} />}
          <ul className="list-disc space-y-1 pl-5">
            {phase.jalon.criteres.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </Liste>
        <p>
          {jalon ? "Pour le franchir, il faut avoir couvert les phases 1 à " + (k + 1) + " : " : "Dans cette phase : "}
          <strong>{acts.length} activités</strong>, <strong>{rolesImpliques.length} rôles</strong>, <strong>{comps.length} compétences</strong>.
        </p>
        {profil && compsProfil.length > 0 && (
          <Preparation ctx={ctx} competences={compsProfil} libelle={jalon ? "Votre préparation à ce jalon" : "Votre préparation à cette phase"} />
        )}
        <Liste titre="Rôles impliqués">
          <ul className="flex flex-wrap gap-1.5">
            {rolesImpliques.map((r) => (
              <li key={r}>
                <Puce ctx={ctx} type="role" id={r} libelle={nomRole(r)} />
              </li>
            ))}
          </ul>
        </Liste>
        {nouvelles.length > 0 && (
          <Liste titre={`Compétences à acquérir dès ${jalon ? "cette phase" : "cette phase"} (${nouvelles.length})`}>
            <ul className="flex flex-wrap gap-1.5">
              {nouvelles.map((c) => (
                <li key={c.id}>
                  <Puce ctx={ctx} type="competence" id={c.id} libelle={c.titre} />
                </li>
              ))}
            </ul>
          </Liste>
        )}
        {!jalon && (
          <Liste titre="Livrables">
            <ul className="list-disc space-y-1 pl-5">
              {phase.livrables.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </Liste>
        )}
      </div>
    );
  }

  if (sel.type === "competence") {
    const c = index.competences.get(sel.id)!;
    const acts = index.activites.filter((a) => a.competences.includes(c.id));
    const phases = [...new Set(acts.map((a) => a.phase))];
    const roles = [...new Set(acts.flatMap((a) => a.roles))];
    const etat = ctx.etatCompetence(c.id);
    const ressources = ctx.apprentissage[c.id] ?? [];
    return (
      <div className="space-y-4 text-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Compétence · {c.bloc}</p>
          <h2 className="text-lg font-bold">{c.titre}</h2>
          <p className="flex items-center gap-2">
            <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${PASTILLE_NIVEAU[c.niveau]}`} />
            {LIBELLE_NIVEAU[c.niveau]}
            {etat && etat !== "hors" && <span className="border border-black px-1.5 text-xs font-bold dark:border-white">Votre statut : {LIBELLE_STATUT[etat]}</span>}
            {etat === "hors" && <span className="border border-dashed border-slate-500 px-1.5 text-xs">Absente de la roadmap de votre rôle</span>}
          </p>
        </div>
        <p>
          Nécessaire <strong>dès la phase {c.premierePhase + 1}</strong> ({titrePhase(index.phases[c.premierePhase])}), dans <strong>{acts.length} activité{acts.length > 1 ? "s" : ""}</strong>.
        </p>
        <Liste titre="Phases">
          <ul className="flex flex-wrap gap-1.5">
            {phases.map((p) => (
              <li key={p}>
                <Puce ctx={ctx} type="phase" id={p} libelle={`${numero(p)} · ${titrePhase(p)}`} />
              </li>
            ))}
          </ul>
        </Liste>
        <Liste titre="Rôles qui la mobilisent">
          <ul className="flex flex-wrap gap-1.5">
            {roles.map((r) => (
              <li key={r}>
                <Puce ctx={ctx} type="role" id={r} libelle={nomRole(r)} />
              </li>
            ))}
          </ul>
        </Liste>
        {ressources.length > 0 && (
          <Liste titre="Pour apprendre">
            <ul className="space-y-1.5">
              {ressources.map((r) => (
                <li key={r.url}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-semibold underline decoration-orange decoration-2 underline-offset-4 hover:bg-orange hover:text-black">
                    {r.nom}
                    <span aria-hidden> ↗</span>
                    <span className="sr-only"> (s&apos;ouvre dans un nouvel onglet)</span>
                  </a>
                  <span className="ml-1.5 inline-flex flex-wrap items-center gap-1 align-middle text-[11px]">
                    {r.acces && (
                      <span className={`border px-1 font-bold ${r.acces === "payant" ? "border-black bg-brand-yellow text-black" : "border-brand-green text-brand-green dark:border-brand-green-light dark:text-brand-green-light"}`}>
                        {r.acces === "payant" ? "Payant" : "Gratuit"}
                      </span>
                    )}
                    {r.langue && <span className="border border-slate-400 px-1 uppercase">{r.langue}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </Liste>
        )}
        <Link href={urlNoeud(c.roadmap, c.id)} className="inline-block font-semibold underline decoration-orange decoration-2 underline-offset-4 hover:bg-orange hover:text-black">
          Ouvrir dans la roadmap ↗
        </Link>
      </div>
    );
  }

  const a = index.activites.find((x) => x.id === sel.id)!;
  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Activité · phase {numero(a.phase)}</p>
        <h2 className="text-lg font-bold">{a.titre}</h2>
      </div>
      <Liste titre="Phase">
        <Puce ctx={ctx} type="phase" id={a.phase} libelle={`${numero(a.phase)} · ${titrePhase(a.phase)}`} />
      </Liste>
      <Liste titre="Rôles">
        <ul className="flex flex-wrap gap-1.5">
          {a.roles.map((r) => (
            <li key={r}>
              <Puce ctx={ctx} type="role" id={r} libelle={nomRole(r)} />
            </li>
          ))}
        </ul>
      </Liste>
      {a.competences.length > 0 && (
        <Liste titre={`Compétences (${a.competences.length})`}>
          <ul className="flex flex-wrap gap-1.5">
            {a.competences.map((c) => (
              <li key={c}>
                <Puce ctx={ctx} type="competence" id={c} libelle={nomComp(c)} />
              </li>
            ))}
          </ul>
        </Liste>
      )}
    </div>
  );
}
