"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  exporterProgression,
  importerProgression,
  decoderEtat,
  type Progression,
} from "@/produits/progression";
import type { Roadmap } from "@/lib/schema";
import { LienSuivi, suivre } from "@/produits/mesure";
import { INSTANCE } from "@/lib/instance";

export default function PanneauProgression({
  roadmap,
  progression,
  onRemplacer,
  onReinitialiser,
  etatPartage,
  onEtatTraite,
  migration,
  onMigrationLue,
}: {
  roadmap: Roadmap;
  progression: Progression;
  onRemplacer: (p: Progression) => void;
  onReinitialiser: () => void;
  /** Contenu du paramètre ?etat= de l'adresse, s'il y en a un. */
  etatPartage: string | null;
  /** Retire ?etat= de l'adresse une fois le lien chargé ou refusé. */
  onEtatTraite: () => void;
  /** Message unique : des compétences déclarées maîtrisées sont devenues « vues ». */
  migration: { declares: number; aAfficher: boolean };
  onMigrationLue: () => void;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [exportee, setExportee] = useState(false);
  const refFichier = useRef<HTMLInputElement>(null);

  const exporter = () => {
    const blob = new Blob([exporterProgression(roadmap, progression)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `progression-${roadmap.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    suivre("export_progression", { roadmap: roadmap.id });
    setExportee(true);
  };

  const importer = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fichier = e.target.files?.[0];
    e.target.value = "";
    if (!fichier) return;
    try {
      const prog = importerProgression(await fichier.text(), roadmap);
      onRemplacer(prog);
      setMessage(`Progression importée (${Object.keys(prog).length} nœuds renseignés).`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Import impossible.");
    }
  };

  let propose: Progression | null = null;
  let erreurEtat: string | null = null;
  if (etatPartage) {
    try {
      propose = decoderEtat(etatPartage, roadmap);
    } catch (err) {
      erreurEtat = err instanceof Error ? err.message : "Lien de sauvegarde illisible.";
    }
  }

  const reinitialiser = () => {
    if (window.confirm("Effacer toute votre progression sur cette roadmap ?")) {
      onReinitialiser();
      setMessage("Progression réinitialisée.");
    }
  };

  const bouton = "bouton !py-1 !text-xs";

  return (
    <section aria-label="Sauvegarde de la progression" className="contents">
      {migration.aAfficher && (
        <div role="status" className="basis-full border-l-2 py-1 pl-3 text-sm" style={{ borderColor: "var(--fg)" }}>
          <p>
            <strong>Votre progression a changé de sens.</strong> Une compétence n&apos;est plus « maîtrisée » parce qu&apos;on le déclare : elle est « acquise » quand on réussit un rappel.
            Les {migration.declares} compétence{migration.declares > 1 ? "s" : ""} que vous aviez déclarée{migration.declares > 1 ? "s" : ""} maîtrisée{migration.declares > 1 ? "s" : ""} sont conservée{migration.declares > 1 ? "s" : ""}
            comme « vue{migration.declares > 1 ? "s" : ""} » : votre pourcentage repart donc de zéro tant que vous ne vous testez pas. Rien n&apos;a été supprimé.
          </p>
          <button type="button" className="bouton mt-2 !py-1 !text-xs" onClick={onMigrationLue}>
            J&apos;ai compris
          </button>
        </div>
      )}

      {(propose || erreurEtat) && (
        <div role="alert" className="basis-full border-l-2 py-1 pl-3 text-sm" style={{ borderColor: "var(--fg)" }}>
          {propose ? (
            <>
              <p>
                Ce lien contient une progression ({Object.keys(propose).length} compétence{Object.keys(propose).length > 1 ? "s" : ""} renseignée{Object.keys(propose).length > 1 ? "s" : ""}).
                {Object.keys(progression).length > 0 && " La charger remplacera celle de ce navigateur."}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  className="bouton !py-1 !text-xs"
                  onClick={() => {
                    onRemplacer(propose!);
                    setMessage("Progression chargée depuis le lien.");
                    onEtatTraite();
                  }}
                >
                  Charger cette progression
                </button>
                <button type="button" className="bouton !py-1 !text-xs" onClick={onEtatTraite}>
                  Ignorer
                </button>
              </div>
            </>
          ) : (
            <>
              <p>{erreurEtat}</p>
              <button type="button" className="bouton mt-2 !py-1 !text-xs" onClick={onEtatTraite}>
                Fermer
              </button>
            </>
          )}
        </div>
      )}

      <details className="text-sm open:basis-full">
        <summary className="cursor-pointer select-none py-1 font-semibold">Sauvegarde</summary>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" onClick={exporter} className={bouton}>
            Exporter (JSON)
          </button>
          <button type="button" onClick={() => refFichier.current?.click()} className={bouton}>
            Importer…
          </button>
          <button type="button" onClick={reinitialiser} className={bouton}>
            Réinitialiser
          </button>
          <input ref={refFichier} type="file" accept="application/json,.json" onChange={importer} className="hidden" aria-label="Fichier de progression à importer" />
        </div>
      </details>
      <p role="status" className="basis-full text-xs empty:hidden" style={{ color: "var(--muted)" }}>
        {message}
      </p>
      {exportee && INSTANCE.newsletterUrl && (
        <p className="basis-full text-xs">
          Progression exportée.{" "}
          <LienSuivi href={INSTANCE.newsletterUrl} externe evenement="abonnement" donnees={{ contexte: "export" }} className="underline">
            Recevoir les nouvelles roadmaps et analyses
          </LienSuivi>
        </p>
      )}
    </section>
  );
}
