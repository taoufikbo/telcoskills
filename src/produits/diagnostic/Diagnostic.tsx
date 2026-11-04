"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { suivre } from "@/produits/mesure";
import { libelleDuree } from "@/lib/duree";
import { recommander, reponsesValides, type Orientation as ConfigOrientation, type Reponses } from "@/lib/orientation-schema";
import { urlNoeud, urlProjet, urlRoadmap } from "@/lib/urls";
import { enregistrerReponses as ecrire, useReponsesEnregistrees } from "@/produits/parcours";
import { suivreParcours, usePratique, useRythme } from "@/produits/progression";
import { ANCRE, decoderProfil, encoderProfil, PARAM } from "./profil";

const lireParam = () => (typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get(PARAM) ?? "");
const abonnerUrl = (cb: () => void) => {
  window.addEventListener("popstate", cb);
  return () => window.removeEventListener("popstate", cb);
};

type Props = {
  config: ConfigOrientation;
  parcours: Record<string, { titre: string; presentation?: string }>;
  /** Titre du nœud de départ, par « parcours/nœud ». */
  titresNoeuds: Record<string, string>;
  /** Projets : pour chaque parcours, le rôle correspondant dans le projet. */
  projets: { id: string; titre: string; roles: Record<string, string> }[];
  /** Heures estimées du nœud de départ et de son bloc, par « parcours/nœud ». */
  durees: { noeuds: Record<string, { noeud: number; bloc: string; heuresBloc: number }> };
  /** Rôles du projet sans roadmap, par identifiant : libellé. */
  rolesSansParcours: Record<string, string>;
  /** Blocs testables, par parcours : le résultat propose le test du premier. */
  testables: { roadmapId: string; bloc: string; slug: string }[];
  /** Vrai : n'affiche rien, sauf si l'adresse porte un résultat partagé (?profil=). Sert au visiteur qui revient. */
  seulementSiPartage?: boolean;
  /** Contenu affiché dans le résultat, sous la recommandation (sortie : le parcours et le premier pas recommandés). */
  apresResultat?: (reco: { roadmapId: string; noeudId: string }) => ReactNode;
  /** Appelé à chaque réponse avec les réponses déjà données (vide quand on recommence) : la page peut montrer un aperçu avant la fin. */
  onBrouillon?: (reponses: Partial<Reponses>) => void;
};

/** Le diagnostic personnel : trois questions, un parcours recommandé, un premier pas. Écrit les réponses dans le produit Parcours. */
export default function Diagnostic({ config, parcours, titresNoeuds, projets, durees, rolesSansParcours, testables, seulementSiPartage = false, apresResultat, onBrouillon }: Props) {
  const { muter } = usePratique();
  const { rythme } = useRythme();
  const { reponses: enregistrees } = useReponsesEnregistrees();
  const profilUrl = useSyncExternalStore(abonnerUrl, lireParam, () => "");
  const [copie, setCopie] = useState(false);
  const partagees = useMemo(() => decoderProfil(config, profilUrl), [config, profilUrl]);
  const memoriseesStockage = useMemo(() => (reponsesValides(config, enregistrees) ? enregistrees : null), [config, enregistrees]);
  // Un lien partagé prime sur la mémoire locale, sans l'écraser.
  const memorisees = partagees ?? memoriseesStockage;

  const [brouillon, setBrouillon] = useState<Partial<Reponses>>({});
  const [etape, setEtape] = useState(0);
  const legende = useRef<HTMLLegendElement>(null);
  const aInteragi = useRef(false);

  // Après un changement de question (et seulement alors), le focus va au titre de la question.
  useEffect(() => {
    if (aInteragi.current) legende.current?.focus();
  }, [etape]);

  const total = config.questions.length;
  const question = config.questions[etape];
  const choix = brouillon[question.id];

  /** Passe à la question suivante, ou termine le test avec ces réponses. */
  const passer = (reponses: Partial<Reponses>) => {
    aInteragi.current = true;
    if (etape < total - 1) setEtape(etape + 1);
    else if (reponsesValides(config, reponses)) {
      suivre("quiz_complete", { metier: reponses.metier, parcours: recommander(config, reponses).roadmapId });
      ecrire(reponses);
      setBrouillon({});
      setEtape(0);
      onBrouillon?.({});
    }
  };
  const avancer = (e: React.FormEvent) => {
    e.preventDefault();
    passer(brouillon);
  };

  if (seulementSiPartage && !partagees) return null;

  if (memorisees) {
    const reco = recommander(config, memorisees);
    const noeud = titresNoeuds[`${reco.roadmapId}/${reco.noeudId}`];
    const projet = reco.projet ? projets.find((p) => p.id === reco.projet) : undefined;
    const roleProjet = projet?.roles[reco.roadmapId];
    const depart = durees.noeuds[`${reco.roadmapId}/${reco.noeudId}`];
    const libelleRole = reco.role ? rolesSansParcours[reco.role] : undefined;
    const aTester = testables.find((t) => t.roadmapId === reco.roadmapId);
    const lienPartage = () => `${window.location.origin}${window.location.pathname}?${PARAM}=${encoderProfil(memorisees)}#${ANCRE}`;
    const copier = async () => {
      try {
        await navigator.clipboard.writeText(lienPartage());
        setCopie(true);
      } catch {
        window.prompt("Copiez ce lien :", lienPartage());
      }
    };
    const refaire = () => {
      if (profilUrl) {
        window.history.replaceState(null, "", `${window.location.pathname}#${ANCRE}`);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
      ecrire(null);
      setCopie(false);
    };
    return (
      <section aria-labelledby="orientation-titre" className="panneau overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 sm:px-6" style={{ borderColor: "var(--filet)" }}>
          <h2 id="orientation-titre" className="text-lg font-bold">
            Votre point de départ
          </h2>
          <button type="button" onClick={refaire} className="text-sm font-bold underline underline-offset-4 hover:no-underline">
            Choisir un autre parcours
          </button>
        </div>
        <div className="space-y-4 p-4 sm:p-6" aria-live="polite">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Parcours recommandé</p>
            <h3 className="text-2xl font-bold">{parcours[reco.roadmapId].titre}</h3>
            {parcours[reco.roadmapId].presentation && <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-400">{parcours[reco.roadmapId].presentation}</p>}
          </div>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {reco.raisons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <p className="text-sm">
            <strong>Durée estimée</strong> : {libelleDuree(depart.noeud, rythme)} pour la première compétence, {libelleDuree(depart.heuresBloc, rythme)} pour le bloc « {depart.bloc} » qui
            l&apos;entoure. <span className="text-slate-600 dark:text-slate-400">Estimation indicative, selon le niveau de chaque compétence.</span>
          </p>
          {libelleRole && reco.role && (
            <p className="border-l-2 py-1 pl-3 text-sm" style={{ borderColor: "var(--fg)" }}>
              Votre rôle, <strong>{libelleRole}</strong>, n&apos;a pas de roadmap à lui.
            </p>
          )}
          {apresResultat?.({ roadmapId: reco.roadmapId, noeudId: reco.noeudId })}
          <div className="flex flex-wrap items-center gap-3">
            <Link href={urlNoeud(reco.roadmapId, reco.noeudId)} onClick={() => muter((e) => suivreParcours(e, reco.roadmapId))} className="btn btn-primary">
              Commencer par « {noeud} » →
            </Link>
            <Link href={urlRoadmap(reco.roadmapId)} className="text-sm underline decoration-[var(--bord)] underline-offset-4 hover:decoration-[var(--fg)]">
              Voir toute la roadmap
            </Link>
            {projet && (
              <Link
                href={`${urlProjet(projet.id, true)}${roleProjet ? `?role=${roleProjet}` : ""}`}
                className="text-sm underline decoration-[var(--bord)] underline-offset-4 hover:decoration-[var(--fg)]"
              >
                Voir le projet de bout en bout, de votre point de vue
              </Link>
            )}
          </div>
          {aTester && (
            <p className="text-sm">
              <Link href={`/positionnement/${aTester.roadmapId}/${aTester.slug}`} className="underline decoration-[var(--bord)] underline-offset-4 hover:decoration-[var(--fg)]">
                Vous connaissez déjà le sujet ? Testez vos acquis sur « {aTester.bloc} »
              </Link>
            </p>
          )}
          <p className="text-sm">
            <button type="button" onClick={copier} className="underline decoration-[var(--bord)] underline-offset-4 hover:decoration-[var(--fg)]">
              Copier le lien de ce résultat
            </button>
            <span role="status" className="ml-2 text-slate-600 dark:text-slate-400">
              {copie ? "Lien copié." : ""}
            </span>
          </p>
          {reco.alternatives.length > 0 && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Vous hésitez ? Aussi adaptés :{" "}
              {reco.alternatives.map((id, i) => (
                <span key={id}>
                  {i > 0 && " · "}
                  <Link href={urlRoadmap(id)} className="underline decoration-[var(--bord)] underline-offset-4 hover:decoration-[var(--fg)]" style={{ color: "var(--fg)" }}>
                    {parcours[id].titre}
                  </Link>
                </span>
              ))}
            </p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="orientation-titre" className="panneau overflow-hidden">
      <div className="border-b px-4 py-4 sm:px-6" style={{ borderColor: "var(--filet)" }}>
        <h2 id="orientation-titre" className="text-lg font-bold">
          Choisir son parcours
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Trois questions, moins d&apos;une minute : on vous propose un parcours et un premier pas. La question suivante s&apos;affiche dès que vous choisissez une réponse.</p>
      </div>
      <form onSubmit={avancer} className="space-y-4 p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <p className="text-sm font-bold" aria-live="polite">
            Question {etape + 1} sur {total}
          </p>
          <div className="flex flex-1 gap-1.5" aria-hidden>
            {config.questions.map((q, i) => (
              <span key={q.id} className="h-1 flex-1 rounded-full" style={{ background: i <= etape ? "var(--fg)" : "var(--filet)" }} />
            ))}
          </div>
        </div>
        <fieldset className="space-y-3">
          <legend ref={legende} tabIndex={-1} className="text-xl font-bold outline-none">
            {question.question}
          </legend>
          {question.aide && <p className="text-sm text-slate-600 dark:text-slate-400">{question.aide}</p>}
          <div className="grid gap-2 sm:grid-cols-2">
            {question.options.map((o) => (
              <label
                key={o.id}
                className="flex cursor-pointer items-center gap-3 rounded-md border border-[var(--bord)] p-3 text-sm font-medium hover:bg-[var(--surface-2)] has-[:checked]:border-[var(--fg)] has-[:checked]:bg-[var(--surface-2)] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--fg)]"
              >
                <input
                  type="radio"
                  name={question.id}
                  value={o.id}
                  checked={choix === o.id}
                  onChange={() => {
                    if (Object.keys(brouillon).length === 0) suivre("quiz_start");
                    const reponses = { ...brouillon, [question.id]: o.id };
                    setBrouillon(reponses);
                    onBrouillon?.(reponses);
                    passer(reponses);
                  }}
                  className="peer sr-only"
                />
                <span aria-hidden className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-current before:h-2 before:w-2 before:rounded-full before:bg-current before:opacity-0 peer-checked:before:opacity-100" />
                {o.libelle}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-wrap gap-2">
          {etape > 0 && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                aInteragi.current = true;
                setEtape(etape - 1);
              }}
            >
              ← Retour
            </button>
          )}
          <button type="submit" disabled={!choix} className="btn btn-ghost disabled:cursor-not-allowed disabled:opacity-50">
            {etape < total - 1 ? "Continuer →" : "Voir mon parcours"}
          </button>
        </div>
      </form>
    </section>
  );
}
