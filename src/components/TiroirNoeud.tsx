"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { urlPageNoeud } from "@/lib/urls";
import { LIBELLE_NIVEAU, LIBELLE_RESSOURCE, STATUT_PRATIQUE } from "@/lib/libelles";
import type { SuiviNoeud } from "@/produits/progression";
import type { StatutDeclarable } from "@/produits/progression";
import { TYPES_RESSOURCE, type Noeud, type Ressource, type Roadmap } from "@/lib/schema";
import { LIBELLE_DEMANDE_COURT, PASTILLE_NIVEAU, STYLE_DEMANDE } from "@/lib/styles";

const FOCUSABLES = "a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex='-1'])";

const ETIQUETTE_ACCES = {
  gratuit: { texte: "Gratuit", style: "border-brand-green text-brand-green dark:border-brand-green-light dark:text-brand-green-light" },
  freemium: { texte: "Gratuit, certificat payant", style: "border-brand-green text-brand-green dark:border-brand-green-light dark:text-brand-green-light" },
  payant: { texte: "Payant", style: "border-black bg-brand-yellow text-black" },
} as const;

function Etiquettes({ ressource }: { ressource: Ressource }) {
  if (!ressource.acces && !ressource.langue && !ressource.auteur) return null;
  const acces = ressource.acces ? ETIQUETTE_ACCES[ressource.acces] : null;
  return (
    <span className="ml-1.5 inline-flex flex-wrap items-center gap-1 align-middle text-[11px]">
      {acces && <span className={`border px-1 font-bold ${acces.style}`}>{acces.texte}</span>}
      {ressource.langue && (
        <span className="border border-slate-400 px-1 uppercase" title={ressource.langue === "fr" ? "En français" : "En anglais"}>
          {ressource.langue}
        </span>
      )}
      {ressource.auteur && <span className="text-slate-500">· {ressource.auteur}</span>}
    </span>
  );
}

export default function TiroirNoeud({
  roadmap,
  noeud,
  modal,
  suivi,
  onStatut,
  estObjectif,
  onObjectif,
  onOuvrir,
  onFermer,
}: {
  roadmap: Roadmap;
  noeud: Noeud;
  suivi: SuiviNoeud;
  onStatut: (id: string, statut: StatutDeclarable) => void;
  estObjectif: boolean;
  onObjectif: () => void;
  /** Plein écran (mobile) : le focus reste dans le tiroir. */
  modal: boolean;
  onOuvrir: (id: string) => void;
  onFermer: () => void;
}) {
  const racine = useRef<HTMLElement>(null);
  const titre = useRef<HTMLHeadingElement>(null);

  // À l'ouverture : mémorise l'élément actif pour lui rendre le focus à la fermeture.
  useEffect(() => {
    const precedent = document.activeElement as HTMLElement | null;
    return () => precedent?.focus?.();
  }, []);

  // À chaque changement de nœud : place le focus sur le titre.
  useEffect(() => {
    titre.current?.focus();
  }, [noeud.id]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onFermer();
    } else if (e.key === "Tab" && modal && racine.current) {
      const els = [...racine.current.querySelectorAll<HTMLElement>(FOCUSABLES)];
      const premier = els[0];
      const dernier = els[els.length - 1];
      if (e.shiftKey && (document.activeElement === premier || document.activeElement === titre.current)) {
        e.preventDefault();
        dernier.focus();
      } else if (!e.shiftKey && document.activeElement === dernier) {
        e.preventDefault();
        premier.focus();
      }
    }
  };

  const parId = new Map(roadmap.noeuds.map((n) => [n.id, n]));
  const debloque = roadmap.noeuds.filter((n) => n.prerequis.includes(noeud.id));
  const groupes = TYPES_RESSOURCE.map((type) => ({
    type,
    items: noeud.ressources.filter((r) => r.type === type),
  })).filter((g) => g.items.length > 0);

  return (
    <aside
      ref={racine}
      role="dialog"
      aria-modal={modal}
      aria-labelledby="tiroir-titre"
      onKeyDown={onKeyDown}
      className="fixed inset-y-0 right-0 z-40 flex w-full flex-col overflow-y-auto border-l-4 border-orange bg-white shadow-xl md:w-[26rem] dark:bg-slate-950"
    >
      <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 id="tiroir-titre" ref={titre} tabIndex={-1} className="flex-1 text-lg font-semibold leading-snug outline-none">
          {noeud.titre}
        </h2>
        <button
          type="button"
          onClick={onFermer}
          aria-label="Fermer le panneau"
          className="-m-1 rounded p-2 text-xl leading-none hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          ×
        </button>
      </div>

      <div className="space-y-5 p-4 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="border border-black px-2 py-0.5 text-xs dark:border-white">{noeud.bloc}</span>
          <span className="flex items-center gap-1.5 text-xs">
            <span className={`h-2.5 w-2.5 rounded-full ${PASTILLE_NIVEAU[noeud.niveau]}`} />
            {LIBELLE_NIVEAU[noeud.niveau]}
          </span>
          {noeud.demande && (
            <span
              className={`rounded px-1.5 py-0.5 text-xs font-semibold ${STYLE_DEMANDE[noeud.demande]}`}
              title={roadmap.legende_demande[noeud.demande]}
            >
              Demande {LIBELLE_DEMANDE_COURT[noeud.demande].toLowerCase()}
            </span>
          )}
        </div>
        {noeud.demande && <p className="text-xs text-slate-500">{roadmap.legende_demande[noeud.demande]}</p>}

        <p className="leading-relaxed">{noeud.resume}</p>
        <Link href={urlPageNoeud(roadmap.id, noeud.id)} className="inline-block text-xs font-semibold underline decoration-orange decoration-2 underline-offset-4">
          Page de la compétence
        </Link>

        <button
          type="button"
          onClick={onObjectif}
          disabled={estObjectif}
          className="bouton !py-1.5 !text-xs"
        >
          {estObjectif ? "⚑ Objectif actuel" : "⚑ Définir comme objectif"}
        </button>

        <section>
          <h3 className="mb-2 font-semibold">Où j&apos;en suis</h3>
          <p className="flex items-center gap-2 font-semibold" aria-live="polite">
            <span aria-hidden className="text-lg leading-none">
              {STATUT_PRATIQUE[suivi.statut].icone}
            </span>
            <span>
              {STATUT_PRATIQUE[suivi.statut].libelle}
              <span className="sr-only"> : {STATUT_PRATIQUE[suivi.statut].detail}</span>
            </span>
            {suivi.echeance && (
              <span className="text-xs font-normal text-slate-600 dark:text-slate-400">
                · prochaine révision {suivi.statut === "a-revoir" ? "due" : "le"} <time dateTime={suivi.echeance}>{new Date(`${suivi.echeance}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</time>
              </span>
            )}
          </p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            « Acquis (testé) » : une compétence ne devient acquise qu&apos;après un rappel réussi, jamais sur simple déclaration.
            {suivi.declare && " Vous l'aviez déclarée maîtrisée : elle reste à confirmer par un test."}
          </p>
          <div role="group" aria-label="Marquer la compétence" className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              aria-pressed={suivi.statut !== "a-decouvrir" && !suivi.horsParcours}
              disabled={suivi.statut === "acquis-teste" || suivi.statut === "a-revoir"}
              onClick={() => onStatut(noeud.id, suivi.statut === "vu" ? "a-faire" : "en-cours")}
              className="bouton !px-2 !py-2 !text-xs disabled:opacity-60"
            >
              {suivi.statut === "vu" ? "◐ Vue (annuler)" : "◐ Marquer comme vue"}
            </button>
            <button type="button" aria-pressed={suivi.horsParcours} onClick={() => onStatut(noeud.id, suivi.horsParcours ? "a-faire" : "ignore")} className="bouton !px-2 !py-2 !text-xs">
              {suivi.horsParcours ? "Remettre dans mon parcours" : "Hors de mon parcours"}
            </button>
          </div>
        </section>

        <section>
          <h3 className="mb-2 font-semibold">Prérequis</h3>
          {noeud.prerequis.length === 0 ? (
            <p className="text-slate-500">Aucun : vous pouvez commencer ici.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {noeud.prerequis.map((id) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => onOuvrir(id)}
                    className="puce !text-sm"
                  >
                    {parId.get(id)?.titre ?? id}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {groupes.length > 0 && (
          <section>
            <h3 className="mb-2 font-semibold">Ressources</h3>
            <div className="space-y-3">
              {groupes.map((g) => (
                <div key={g.type}>
                  <h4 className="text-xs uppercase tracking-wide text-slate-500">{LIBELLE_RESSOURCE[g.type]}</h4>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {g.items.map((r) => (
                      <li key={r.url ?? r.nom}>
                        {r.url ? (
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold underline decoration-orange decoration-2 underline-offset-4 hover:bg-orange hover:text-black"
                          >
                            {r.nom}
                            <span aria-hidden> ↗</span>
                            <span className="sr-only"> (s&apos;ouvre dans un nouvel onglet)</span>
                          </a>
                        ) : (
                          r.nom
                        )}
                        <Etiquettes ressource={r} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {noeud.projet && (
          <section className="rounded-md border border-dashed border-slate-400 p-3 dark:border-slate-600">
            <h3 className="mb-1 font-semibold">Projet pratique</h3>
            <p>{noeud.projet}</p>
          </section>
        )}

        {debloque.length > 0 && (
          <section>
            <h3 className="mb-2 font-semibold">Débloque</h3>
            <ul className="flex flex-wrap gap-2">
              {debloque.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => onOuvrir(n.id)}
                    className="puce !text-sm"
                  >
                    {n.titre}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </aside>
  );
}
