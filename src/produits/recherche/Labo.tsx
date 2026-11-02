"use client";

import { useState } from "react";
import { rechercher, type EntreeRecherche } from "./recherche";

/** Page d'essai : la recherche pure sur l'index publié, sans la palette. */
export default function LaboRecherche({ index }: { index: EntreeRecherche[] }) {
  const [requete, setRequete] = useState("");
  const resultats = requete ? rechercher(index, requete) : [];
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold">Recherche</h1>
      <p className="mono">{index.length} entrées dans l&apos;index.</p>
      <input
        type="search"
        value={requete}
        onChange={(e) => setRequete(e.target.value)}
        placeholder="Essayer : kubernetes, sr-iov, 5g…"
        aria-label="Requête"
        className="w-full max-w-md rounded-md border px-3 py-2"
        style={{ borderColor: "var(--bord)", background: "var(--surface)" }}
      />
      <ol className="space-y-1" data-resultats>
        {resultats.map((r) => (
          <li key={`${r.genre}:${r.href}`} className="text-sm">
            {r.titre} <span className="mono">{r.href}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
