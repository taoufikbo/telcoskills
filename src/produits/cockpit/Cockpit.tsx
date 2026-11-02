"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { Orientation } from "@/lib/orientation-schema";
import { urlProjet } from "@/lib/urls";
import type { Cockpit as Donnees } from "./calcul";
import { formaterArrivee, libelleSemaines } from "./format";
import Rythme from "./Rythme";

type Props = {
  donnees: Donnees;
  /** Titre de la roadmap (pour le texte alternatif de la barre). */
  titre: string;
  /** Hypothèse éditoriale d'heures par niveau, rappelée en note. */
  parNiveau: Orientation["duree_par_niveau_heures"];
  /** Événements de sortie. */
  onOuvrir: (id: string) => void;
  onRythme: (heuresParSemaine: number) => void;
  /** Ouvre la vue Objectif ; `null` : sans cible encore choisie. */
  onObjectif: (id: string | null) => void;
  /** Parcours terminé : renvoie vers le projet fil rouge. */
  projetId?: string;
  /** Visiteur sans progression : rappelle le mode d'emploi et le lien vers le diagnostic. */
  aide?: boolean;
  /** Bouton « Suivre ce parcours » (ou la mention « Mon parcours »), placé dans le cockpit. */
  parcours?: ReactNode;
};

const lien = "underline decoration-[var(--bord)] underline-offset-4 hover:decoration-[var(--fg)]";

function Barre({ acquis, vus, total, libelle }: { acquis: number; vus: number; total: number; libelle: string }) {
  const pct = (n: number) => (total === 0 ? 0 : (n / total) * 100);
  return (
    <div role="progressbar" aria-label={libelle} aria-valuemin={0} aria-valuemax={total} aria-valuenow={acquis} className="flex h-2 w-full overflow-hidden" style={{ background: "var(--filet)" }}>
      <div style={{ width: `${pct(acquis)}%`, background: "var(--fg)" }} />
      <div style={{ width: `${pct(vus)}%`, background: "color-mix(in srgb, var(--fg) 40%, transparent)" }} />
    </div>
  );
}

function Mesure({ valeur, libelle }: { valeur: string; libelle: string }) {
  return (
    <div>
      <dd className="text-2xl font-semibold tabular-nums">{valeur}</dd>
      <dt className="mono" style={{ color: "var(--muted)" }}>
        {libelle}
      </dt>
    </div>
  );
}

/** Le cockpit d'une roadmap : où j'en suis, les heures, la prochaine étape en un clic, les révisions, l'objectif, la date d'arrivée estimée. */
export default function Cockpit({ donnees, titre, parNiveau, onOuvrir, onRythme, onObjectif, projetId, aide = false, parcours }: Props) {
  const { programme: p, decompte: d, suite, revision, objectif, projection, rythme, aVenir } = donnees;
  const aDecouvrir = Math.max(0, d.actifs - d.acquis - d.vus);
  const etiquette = suite.type === "debut" ? "Commencer ici" : suite.type === "termine" ? "Parcours terminé" : suite.enCours ? "Reprendre ici" : "Prochaine étape";
  // Une seule action principale : réviser quand des révisions sont dues, sinon la prochaine étape.
  const reviser = revision.total > 0 && revision.premier;
  const primaire = "btn btn-primary btn-sm";
  const secondaire = "btn btn-ghost btn-sm";

  return (
    <section aria-label="Cockpit du parcours" className="border-b px-4 py-5" style={{ borderColor: "var(--filet)", background: "var(--surface)" }}>
      <div className="grid gap-x-10 gap-y-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="mono">Où j&apos;en suis</h2>
            {parcours}
          </div>
          <p className="text-lg">
            <strong className="font-semibold tabular-nums">{d.acquis}</strong> acquis{d.aRevoir > 0 && <> (dont {d.aRevoir} à revoir)</>} · <strong className="font-semibold tabular-nums">{d.vus}</strong> vus ·{" "}
            <span className="tabular-nums">{aDecouvrir}</span> à découvrir
            <span style={{ color: "var(--muted)" }}> sur {d.actifs}</span>
          </p>
          <Barre acquis={d.acquis} vus={d.vus} total={d.actifs} libelle={`Compétences acquises par un test et vues : ${titre}`} />
          <dl className="grid grid-cols-3 gap-4 border-t pt-4" style={{ borderColor: "var(--filet)" }}>
            <Mesure valeur={`${p.faites} h`} libelle="faites" />
            <Mesure valeur={`${p.restantes} h`} libelle="restantes" />
            <Mesure valeur={`${p.heures} h`} libelle="au total" />
          </dl>
          <Rythme rythme={rythme} onChange={onRythme} projection={projection} />
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            Estimation indicative : heures supposées par niveau ({parNiveau.fondamental} h fondamental, {parNiveau.intermediaire} h intermédiaire, {parNiveau.avance} h avancé, {parNiveau.transverse} h transverse), comptées pour les
            compétences acquises par un test. Ce n&apos;est pas une mesure de votre temps.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <h2 className="mono">{etiquette}</h2>
            {suite.noeud ? (
              <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <p className="min-w-0 flex-1 basis-56 text-lg font-semibold">{suite.noeud.titre}</p>
                <button type="button" className={reviser ? secondaire : primaire} onClick={() => onOuvrir(suite.noeud!.id)}>
                  Ouvrir →
                </button>
              </div>
            ) : (
              projetId && (
                <p className="mt-1 text-sm">
                  <Link href={urlProjet(projetId)} className={lien}>
                    Voyez ces compétences à l&apos;œuvre dans le projet fil rouge
                  </Link>
                </p>
              )
            )}
          </div>

          {revision.total > 0 && revision.premier && (
            <div className="border-t pt-4" style={{ borderColor: "var(--filet)" }}>
              <h2 className="mono">Révisions dues</h2>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <p className="min-w-0 flex-1 basis-56 text-sm">
                  <strong className="font-semibold tabular-nums">{revision.total}</strong> à réviser aujourd&apos;hui dans ce parcours, à commencer par « {revision.premier.titre} »
                </p>
                <button type="button" className={primaire} onClick={() => onOuvrir(revision.premier!.id)}>
                  Réviser →
                </button>
              </div>
            </div>
          )}

          {aVenir.length > 0 && (
            <div className="border-t pt-4" style={{ borderColor: "var(--filet)" }}>
              <h2 className="mono">Révisions à venir</h2>
              <ul className="mt-1 space-y-1 text-sm">
                {aVenir.map((r) => (
                  <li key={r.id} className="flex items-baseline gap-3">
                    <span className="mono w-40 shrink-0 whitespace-nowrap tabular-nums">{formaterArrivee(r.jour)}</span>
                    <button type="button" className={`min-w-0 text-left ${lien}`} onClick={() => onOuvrir(r.id)}>
                      {r.titre}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="border-t pt-4" style={{ borderColor: "var(--filet)" }}>
            <h2 className="mono">Objectif</h2>
            {objectif ? (
              <div className="mt-1 space-y-2">
                <p className="text-lg font-semibold">{objectif.titre}</p>
                {objectif.restantes === 0 ? (
                  <p className="text-sm">Objectif atteint : toutes ses compétences sont acquises.</p>
                ) : (
                  <p className="text-sm">
                    {objectif.restantes} compétence{objectif.restantes > 1 ? "s" : ""} à acquérir, soit environ {objectif.heures} h (estimation indicative) ; chemin critique : {objectif.etapesCritiques} étape
                    {objectif.etapesCritiques > 1 ? "s" : ""} à la suite.
                    {objectif.projection.arrivee && (
                      <>
                        {" "}
                        À {rythme} h par semaine : {libelleSemaines(objectif.projection.semaines)}, vers le {formaterArrivee(objectif.projection.arrivee)}.
                      </>
                    )}
                  </p>
                )}
                {objectif.restantes > 0 && (
                  <details className="text-sm">
                    <summary className="cursor-pointer select-none py-1 font-semibold">Chemin critique ({objectif.chemin.length} compétences)</summary>
                    <ol className="mt-1 space-y-0.5 pl-5">
                      {objectif.chemin.map((c) => (
                        <li key={c.id} className="list-decimal">
                          <button type="button" className={`text-left ${lien}`} onClick={() => onOuvrir(c.id)}>
                            {c.titre}
                          </button>
                        </li>
                      ))}
                    </ol>
                  </details>
                )}
                <button type="button" className={secondaire} onClick={() => onObjectif(objectif.id)}>
                  Voir sur la carte
                </button>
              </div>
            ) : (
              <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <p className="min-w-0 flex-1 basis-56 text-sm">Visez une compétence : le cockpit calcule ce qu&apos;il reste à acquérir, son chemin critique et la date d&apos;arrivée.</p>
                <button type="button" className={secondaire} onClick={() => onObjectif(null)}>
                  Choisir un objectif
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {aide && (
        <p className="mt-4 text-xs" style={{ color: "var(--muted)" }}>
          Ouvrez une compétence et marquez-la « vue » ; elle devient « acquise (testé) » quand vous réussissez le rappel. Le suivi reste dans ce navigateur, sans compte.{" "}
          <Link href="/#diagnostic" className={lien}>
            Pas sûr de ce parcours ? Choisir son parcours en trois questions
          </Link>
        </p>
      )}
    </section>
  );
}
