"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { UnitSylva } from "@/lib/sylva";
import { normaliser } from "@/produits/recherche";

const MATURITES = [
  ["core-component", "Socle"],
  ["stable", "Stable"],
  ["beta", "Bêta"],
  ["experimental", "Expérimental"],
] as const;
const LIBELLE_MATURITE: Record<string, string> = Object.fromEntries(MATURITES);

type Props = {
  units: UnitSylva[];
  fonctions: Record<string, string>;
  /** Unit → adresse de l'outil dans le landscape général. */
  liens: Record<string, string>;
};

/** Landscape de Sylva : tous les composants intégrés, par fonction, filtrables par maturité, par origine SUSE et par texte. */
export default function LandscapeSylva({ units, fonctions, liens }: Props) {
  const [maturites, setMaturites] = useState<string[]>([]);
  const [suseSeul, setSuseSeul] = useState(false);
  const [requete, setRequete] = useState("");
  const q = normaliser(requete);
  const visibles = useMemo(
    () =>
      units.filter(
        (u) =>
          (maturites.length === 0 || (u.maturite && maturites.includes(u.maturite))) &&
          (!suseSeul || u.suse) &&
          (!q || normaliser(`${u.id} ${u.description}`).includes(q)),
      ),
    [units, maturites, suseSeul, q],
  );
  const basculer = (m: string) => setMaturites((x) => (x.includes(m) ? x.filter((y) => y !== m) : [...x, m]));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrer les composants">
        {MATURITES.map(([m, libelle]) => (
          <button key={m} type="button" className="bouton !px-3 !py-1 !text-sm" aria-pressed={maturites.includes(m)} onClick={() => basculer(m)}>
            {libelle} ({units.filter((u) => u.maturite === m).length})
          </button>
        ))}
        <button type="button" className="bouton !px-3 !py-1 !text-sm" aria-pressed={suseSeul} onClick={() => setSuseSeul((v) => !v)}>
          Pile SUSE ({units.filter((u) => u.suse).length})
        </button>
        <input
          type="search"
          value={requete}
          onChange={(e) => setRequete(e.target.value)}
          placeholder="Filtrer : longhorn, cni, backup…"
          aria-label="Filtrer les composants par nom ou description"
          className="min-w-0 flex-1 rounded-md border px-3 py-1.5 text-sm sm:max-w-xs"
          style={{ borderColor: "var(--bord)", background: "var(--surface)" }}
        />
      </div>
      <p className="mono" aria-live="polite" data-compte>
        {visibles.length} composant{visibles.length > 1 ? "s" : ""} sur {units.length}.
      </p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Object.entries(fonctions).map(([f, libelle]) => {
          const liste = visibles.filter((u) => u.fonction === f);
          if (liste.length === 0) return null;
          return (
            <section key={f} aria-label={libelle} className="panneau min-w-0 space-y-3 p-4">
              <h3 className="flex items-baseline justify-between gap-2 font-semibold">
                {libelle}
                <span className="mono">{liste.length}</span>
              </h3>
              <ul className="space-y-2.5">
                {liste.map((u) => (
                  <li key={u.id} className="border-t pt-2.5 first:border-t-0 first:pt-0" style={{ borderColor: "var(--filet)" }}>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-sm font-semibold [overflow-wrap:anywhere]">{u.id}</span>
                      {u.maturite && <span className="mono rounded border px-1 text-[10px]" style={{ borderColor: "var(--bord)" }}>{LIBELLE_MATURITE[u.maturite]}</span>}
                      {u.suse && (
                        <span className="mono rounded px-1 text-[10px]" style={{ background: "var(--fg)", color: "var(--bg)" }} title="Chart ou manifeste issu d'un dépôt SUSE, Rancher, SUSE Edge ou NeuVector">
                          SUSE
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm [overflow-wrap:anywhere]" style={{ color: "var(--muted)" }}>
                      {u.description}
                    </p>
                    <p className="mono mt-1 flex flex-wrap gap-x-3 text-xs [overflow-wrap:anywhere]">
                      {u.version && <span>{u.version}</span>}
                      {u.source?.startsWith("http") && (
                        <a href={u.source} target="_blank" rel="noopener noreferrer" className="underline">
                          source ↗
                        </a>
                      )}
                      {liens[u.id] && (
                        <Link href={liens[u.id]} className="underline">
                          dans le landscape
                        </Link>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
