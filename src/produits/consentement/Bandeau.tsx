"use client";

import Link from "next/link";
import { useConsentement } from "./useConsentement";

/**
 * Bandeau de choix pour la mesure d'audience. Aucun cookie n'est déposé par ce site ; le choix porte sur la mesure (Vercel Web Analytics).
 * Refuser est aussi simple qu'accepter : deux boutons identiques. Il ne bloque pas la page (pas de fenêtre modale).
 */
export default function Bandeau({ urlConfidentialite = "/confidentialite", forcer = false }: { urlConfidentialite?: string; /** Page d'essai : affiché même après un choix. */ forcer?: boolean }) {
  const { choix, pret, accepter, refuser } = useConsentement();
  if (!pret || (choix !== null && !forcer)) return null;
  return (
    <section
      aria-label="Mesure d'audience"
      className="fixed inset-x-0 bottom-0 z-40 border-t px-4 py-3 sm:px-6"
      style={{ borderColor: "var(--bord)", background: "var(--bg)", color: "var(--fg)" }}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <p className="min-w-0 flex-1 basis-80 text-sm">
          <strong className="font-semibold">Ce site ne dépose aucun cookie.</strong> Avec votre accord, il mesure sa fréquentation (pages vues, clics sur les boutons principaux) avec Vercel Web Analytics, sans
          cookie. Refuser ne change rien à ce que vous pouvez faire sur le site.{" "}
          <Link href={urlConfidentialite} className="underline decoration-[var(--bord)] underline-offset-4 hover:decoration-[var(--fg)]">
            Confidentialité
          </Link>
        </p>
        <div className="flex gap-3">
          <button type="button" className="bouton" onClick={refuser}>
            Refuser
          </button>
          <button type="button" className="bouton" onClick={accepter}>
            Accepter
          </button>
        </div>
      </div>
    </section>
  );
}
