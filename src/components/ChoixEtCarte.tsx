"use client";

import Link from "next/link";
import { useState, useSyncExternalStore, type ComponentProps, type ReactNode } from "react";
import { libelleDuree } from "@/lib/duree";
import { classerParcours, type Reponses } from "@/lib/orientation-schema";
import { urlNoeud, urlRoadmap } from "@/lib/urls";
import type { Disposition } from "@/produits/carte-heros";
import { Diagnostic } from "@/produits/diagnostic";
import { suivre } from "@/produits/mesure";
import CarteHerosSuivie from "./CarteHerosSuivie";
import ProgrammeChoisi from "./ProgrammeChoisi";

type PropsDiagnostic = Omit<ComponentProps<typeof Diagnostic>, "apresResultat" | "onBrouillon" | "seulementSiPartage">;

/** Un métier (une roadmap) placé sur l'axe cloud, télécom : sa répartition en compétences et son premier pas. */
export type MetierSurAxe = {
  id: string;
  titre: string;
  presentation?: string;
  nbCompetences: number;
  /** Compétences par monde ; les transverses (sécurité, réglementation, tests) sont comptées à part. */
  parts: { cloud: number; convergence: number; telecom: number };
  transverses: number;
  /** Premier pas pour qui débute en télécom, et durée estimée en heures. */
  depart: { noeudId: string; titre: string; heures: number };
};

type Props = PropsDiagnostic & {
  metiers: MetierSurAxe[];
  /** Carte affichée avant tout choix, et sa légende. */
  carteParDefaut: Disposition;
  legendeCarte: ReactNode;
  /** L'idée directrice, sous le visuel. */
  these: string;
  nbOutils: number;
};

const COULEURS = {
  cloud: "var(--accent)",
  convergence: "color-mix(in srgb, var(--accent) 50%, var(--crit))",
  telecom: "var(--crit)",
} as const;
const MONDES = ["cloud", "convergence", "telecom"] as const;
const LIBELLE_MONDE = { cloud: "cloud", convergence: "les deux mondes", telecom: "télécom" } as const;

const sansAbonnement = () => () => {};
const profilDansLAdresse = () => new URLSearchParams(window.location.search).has("profil");

/**
 * Raccord de page : le choix du métier sur l'axe cloud, télécom, et la carte du hero qui montre son chemin.
 * Survoler ou choisir un métier dessine son parcours ; les trois questions du diagnostic affinent le choix.
 * Les produits Diagnostic et Carte héros ne se connaissent pas : seul ce raccord les relie.
 */
export default function ChoixEtCarte({ metiers, carteParDefaut, legendeCarte, these, nbOutils, ...diagnostic }: Props) {
  const [choisi, setChoisi] = useState<string | null>(null);
  const [survole, setSurvole] = useState<string | null>(null);
  const [brouillon, setBrouillon] = useState<Partial<Reponses>>({});
  const [ouvertManuel, setOuvertManuel] = useState(false);
  const profilUrl = useSyncExternalStore(sansAbonnement, profilDansLAdresse, () => false);

  const enQuestions = Object.keys(brouillon).length > 0;
  // La carte suit, dans l'ordre : le survol, le choix, les réponses déjà données au diagnostic.
  const apercu = survole ?? choisi ?? (enQuestions ? classerParcours(diagnostic.config, brouillon)[0] : null);
  const metier = metiers.find((m) => m.id === choisi);

  return (
    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:gap-12">
      <div className="space-y-5">
        <section aria-labelledby="titre-axe" className="panneau space-y-4 p-4 sm:p-6">
          <div className="space-y-1">
            <h2 id="titre-axe" className="text-lg font-semibold">
              Quel est votre métier ?
            </h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Un clic : le parcours de ce métier s&apos;affiche sur la carte. Chaque barre montre où il se situe entre le cloud et le télécom.
            </p>
          </div>

          <div aria-hidden="true" className="hidden items-center gap-3 px-2 sm:flex">
            <span className="w-56 shrink-0" />
            <div className="flex-1">
              <div className="mono flex justify-between" style={{ fontSize: "0.75rem" }}>
                <span style={{ color: COULEURS.cloud }}>MONDE CLOUD</span>
                <span style={{ color: COULEURS.telecom }}>MONDE TÉLÉCOM</span>
              </div>
              <div className="mt-1 h-1 rounded-full" style={{ background: `linear-gradient(90deg, ${COULEURS.cloud}, ${COULEURS.convergence}, ${COULEURS.telecom})` }} />
            </div>
          </div>

          <ul className="space-y-2">
            {metiers.map((m) => {
              const actif = m.id === choisi;
              const total = m.parts.cloud + m.parts.convergence + m.parts.telecom;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    aria-pressed={actif}
                    onClick={() => {
                      setChoisi(m.id);
                      suivre("cta_clic", { emplacement: "accueil-metier", parcours: m.id });
                    }}
                    onMouseEnter={() => setSurvole(m.id)}
                    onMouseLeave={() => setSurvole(null)}
                    onFocus={() => setSurvole(m.id)}
                    onBlur={() => setSurvole(null)}
                    className="flex w-full flex-col gap-2 rounded-md border p-2 text-left transition-colors hover:bg-[var(--surface-2)] sm:flex-row sm:items-center sm:gap-3"
                    style={{ borderColor: actif ? "var(--fg)" : "var(--filet)", background: actif ? "var(--surface-2)" : undefined }}
                  >
                    <span className="block w-full sm:w-56 sm:shrink-0">
                      <span className="block text-sm font-medium leading-tight">{m.titre}</span>
                      <span className="mono block" style={{ fontSize: "0.75rem" }}>
                        {m.nbCompetences} compétences
                      </span>
                    </span>
                    <span
                      className="flex h-7 flex-1 gap-0.5"
                      role="img"
                      aria-label={`${m.titre} : ${MONDES.filter((k) => m.parts[k] > 0)
                        .map((k) => `${m.parts[k]} compétences ${LIBELLE_MONDE[k]}`)
                        .join(", ")}, ${m.transverses} transverses`}
                    >
                      {MONDES.filter((k) => m.parts[k] > 0).map((k) => (
                        <span
                          key={k}
                          className="mono flex min-w-1.5 items-center justify-center rounded-sm"
                          style={{ flex: m.parts[k] / total, background: COULEURS[k], color: "var(--accent-fg)", fontSize: "0.75rem" }}
                        >
                          {m.parts[k] / total > 0.07 ? m.parts[k] : ""}
                        </span>
                      ))}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <p className="mono flex flex-wrap gap-x-4 gap-y-1" style={{ fontSize: "0.75rem" }}>
            {MONDES.map((k) => (
              <span key={k}>
                <span aria-hidden="true" className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm align-baseline" style={{ background: COULEURS[k] }} />
                {k === "convergence" ? "là où les deux se touchent" : `compétences ${LIBELLE_MONDE[k]}`}
              </span>
            ))}
          </p>

          <div aria-live="polite">
            {metier && (
              <div className="space-y-3 border-t pt-4" style={{ borderColor: "var(--filet)" }}>
                {metier.presentation && <p className="text-sm">{metier.presentation}</p>}
                <p className="text-sm">
                  <span className="mono">Premier pas, si le télécom est nouveau pour vous</span>
                  <br />
                  <strong>{metier.depart.titre}</strong>
                  <span style={{ color: "var(--muted)" }}> : {libelleDuree(metier.depart.heures)}</span>
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Link href={urlNoeud(metier.id, metier.depart.noeudId)} className="btn btn-primary">
                    Commencer par « {metier.depart.titre} »
                  </Link>
                  <Link href={urlRoadmap(metier.id)} className="text-sm underline underline-offset-4">
                    Voir tout le parcours
                  </Link>
                </div>
              </div>
            )}
          </div>

          <p className="border-t pt-4 text-sm" style={{ borderColor: "var(--filet)", color: "var(--muted)" }}>
            {these}
          </p>
        </section>

        <details
          open={profilUrl || ouvertManuel || enQuestions}
          onToggle={(e) => setOuvertManuel(e.currentTarget.open)}
          className="rounded-lg border"
          style={{ borderColor: "var(--filet)" }}
        >
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Votre métier n&apos;est pas dans la liste, ou vous hésitez ? Trois questions pour affiner</summary>
          <div className="p-2 sm:p-3">
            <Diagnostic
              {...diagnostic}
              onBrouillon={(r) => {
                setBrouillon(r);
                if (Object.keys(r).length > 0) setChoisi(null);
              }}
              apresResultat={(reco) => <ProgrammeChoisi roadmapId={reco.roadmapId} parNiveau={diagnostic.config.duree_par_niveau_heures} />}
            />
          </div>
        </details>
      </div>

      <figure className="panneau w-full p-4 sm:p-5 xl:sticky xl:top-20">
        <CarteHerosSuivie defaut={carteParDefaut} config={diagnostic.config} legendeDefaut={legendeCarte} apercu={apercu} />
        <p className="mono mt-3 border-t pt-3" style={{ borderColor: "var(--filet)" }}>
          Et les outils ?{" "}
          <Link href="/ressources/landscape" className="underline" style={{ color: "var(--fg)" }}>
            {nbOutils} outils de la pile, par rôle : voir le landscape
          </Link>
        </p>
      </figure>
    </div>
  );
}
