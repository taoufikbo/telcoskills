"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { jourLocal } from "@/lib/jour";
import { suivre } from "@/produits/mesure";
import { useReponsesEnregistrees } from "@/produits/parcours";
import { doitAfficher, lireEtat, type EtatInscription } from "./regles";

const CLE = "tcr:inscription";
const EVENEMENT = "tcr:inscription-maj";

const lire = () => {
  try {
    return localStorage.getItem(CLE);
  } catch {
    return null;
  }
};
const abonner = (cb: () => void) => {
  window.addEventListener(EVENEMENT, cb);
  return () => window.removeEventListener(EVENEMENT, cb);
};
function ecrire(f: (e: EtatInscription) => EtatInscription) {
  try {
    localStorage.setItem(CLE, JSON.stringify(f(lireEtat(localStorage.getItem(CLE)))));
  } catch {
    // stockage indisponible : l'encart reste fermé pour cette page seulement
  }
  window.dispatchEvent(new Event(EVENEMENT));
}

type Props = {
  /** Adresse du formulaire du service d'envoi (POST). */
  action: string;
  /** Nom du champ e-mail attendu par ce service (par exemple « EMAIL » pour Brevo, « email » pour Buttondown). */
  champEmail: string;
  /** Page d'essai : toujours affiché, envoi neutralisé. */
  essai?: boolean;
};

/**
 * Encart d'inscription aux mises à jour : non intrusif (ancré en bas d'écran, jamais modal), proposé à un moment utile,
 * fermable, et qui ne revient pas avant 30 jours. Le formulaire est envoyé au service d'envoi dans un nouvel onglet.
 */
export default function EncartInscription({ action, champEmail, essai = false }: Props) {
  const chemin = usePathname();
  const brut = useSyncExternalStore(abonner, lire, () => null);
  const pret = useSyncExternalStore(abonner, () => true, () => false);
  const { reponses } = useReponsesEnregistrees();
  const [ferme, setFerme] = useState(false);
  const id = useId();

  // Une page vue de plus à chaque changement d'adresse.
  useEffect(() => {
    if (!essai) ecrire((e) => ({ ...e, pages: e.pages + 1 }));
  }, [chemin, essai]);

  if (!pret || ferme) return null;
  const etat = lireEtat(brut);
  if (!essai && !doitAfficher(etat, reponses !== null, jourLocal(new Date()))) return null;

  const plusTard = () => {
    if (!essai) ecrire((e) => ({ ...e, fermeLe: jourLocal(new Date()) }));
    setFerme(true);
  };

  return (
    <aside
      aria-labelledby={`${id}-titre`}
      className="panneau fixed inset-x-3 bottom-3 z-40 space-y-3 p-4 shadow-sm sm:inset-x-auto sm:right-4 sm:w-96"
      style={{ background: "var(--surface)" }}
      data-encart-inscription
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id={`${id}-titre`} className="font-semibold">
          Recevez les nouveaux parcours
        </h2>
        <button type="button" onClick={plusTard} className="mono shrink-0 underline" aria-label="Fermer : me le proposer plus tard">
          Plus tard
        </button>
      </div>
      <p className="text-sm" style={{ color: "var(--muted)" }}>
        Un e-mail quand un parcours ou une analyse paraît, rien d&apos;autre. Désinscription en un clic.
      </p>
      <form
        action={action}
        method="post"
        target="_blank"
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          if (essai) {
            e.preventDefault();
            return;
          }
          suivre("abonnement", { contexte: "encart" });
          ecrire((x) => ({ ...x, inscritLe: jourLocal(new Date()) }));
          setFerme(true);
        }}
      >
        <label htmlFor={`${id}-email`} className="sr-only">
          Votre e-mail
        </label>
        <input
          id={`${id}-email`}
          name={champEmail}
          type="email"
          required
          autoComplete="email"
          placeholder="Votre e-mail"
          className="min-w-0 flex-1 rounded-md border px-3 py-2 text-sm"
          style={{ borderColor: "var(--bord)", background: "var(--bg)" }}
        />
        <button type="submit" className="btn btn-ghost btn-sm">
          Me tenir informé
        </button>
      </form>
      <p className="mono text-xs">
        Adresse utilisée uniquement pour ces envois.{" "}
        <Link href="/confidentialite" className="underline">
          Confidentialité
        </Link>
      </p>
    </aside>
  );
}
