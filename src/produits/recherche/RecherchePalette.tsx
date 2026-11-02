"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { rechercher, type EntreeRecherche } from "./recherche";

export const EVENEMENT_RECHERCHE = "tcr:ouvrir-recherche";

export function BoutonRecherche({ className = "", surNoir = false }: { className?: string; surNoir?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(EVENEMENT_RECHERCHE))}
      className={`flex items-center gap-2 border-2 px-3 py-1.5 text-sm ${surNoir ? "border-white text-white hover:border-orange hover:text-orange" : "border-black text-slate-600 hover:border-orange dark:border-white dark:text-slate-300"} ${className}`}
    >
      <span>Rechercher…</span>
      <kbd className="ml-auto hidden border border-current px-1 text-xs sm:inline">⌘K</kbd>
    </button>
  );
}

export default function RecherchePalette() {
  const [index, setIndex] = useState<EntreeRecherche[]>([]);
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [requete, setRequete] = useState("");
  const [actif, setActif] = useState(0);
  const refInput = useRef<HTMLInputElement>(null);

  const resultats = useMemo(() => rechercher(index, requete), [index, requete]);

  const fermer = () => {
    setOuvert(false);
    setRequete("");
    setActif(0);
  };

  useEffect(() => {
    const ouvrir = () => setOuvert(true);
    const touche = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOuvert((o) => !o);
      }
    };
    window.addEventListener(EVENEMENT_RECHERCHE, ouvrir);
    window.addEventListener("keydown", touche);
    return () => {
      window.removeEventListener(EVENEMENT_RECHERCHE, ouvrir);
      window.removeEventListener("keydown", touche);
    };
  }, []);

  useEffect(() => {
    if (ouvert) refInput.current?.focus();
  }, [ouvert]);

  // L'index (toutes les roadmaps et compétences) ne se télécharge qu'à la première ouverture de la recherche.
  useEffect(() => {
    if (!ouvert || index.length > 0) return;
    let annule = false;
    fetch("/index-recherche.json")
      .then((r) => (r.ok ? r.json() : []))
      .then((donnees: EntreeRecherche[]) => {
        if (!annule) setIndex(donnees);
      })
      .catch(() => undefined);
    return () => {
      annule = true;
    };
  }, [ouvert, index.length]);

  if (!ouvert) return null;

  const aller = (e: EntreeRecherche) => {
    fermer();
    router.push(e.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") fermer();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActif((a) => Math.min(a + 1, resultats.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActif((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && resultats[actif]) aller(resultats[actif]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[10vh]" onMouseDown={fermer}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Recherche"
        onKeyDown={onKeyDown}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-xl overflow-hidden border-2 border-black bg-white shadow-xl dark:border-white dark:bg-slate-950"
      >
        <input
          ref={refInput}
          value={requete}
          onChange={(e) => {
            setRequete(e.target.value);
            setActif(0);
          }}
          placeholder="Rechercher une roadmap ou un nœud…"
          aria-label="Rechercher une roadmap ou un nœud"
          className="w-full border-b-2 border-black bg-transparent px-4 py-3 outline-none focus-visible:outline-none dark:border-white"
        />
        <ul role="listbox" className="max-h-80 overflow-y-auto">
          {resultats.map((r, i) => (
            <li key={r.href} role="option" aria-selected={i === actif}>
              <button
                type="button"
                onClick={() => aller(r)}
                onMouseEnter={() => setActif(i)}
                className={`flex w-full flex-col px-4 py-2 text-left ${i === actif ? "bg-orange text-black" : ""}`}
              >
                <span className="font-medium">{r.titre}</span>
                <span className={`text-xs ${i === actif ? "text-black" : "text-slate-500"}`}>{r.contexte}</span>
              </button>
            </li>
          ))}
          {requete.trim() && resultats.length === 0 && (
            <li className="px-4 py-3 text-sm text-slate-500">Aucun résultat.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
