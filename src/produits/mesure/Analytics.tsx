"use client";

import Script from "next/script";
import { INSTANCE } from "@/lib/instance";
import { useConsentement } from "@/produits/consentement";
import { mesureActive } from "./active";

/**
 * Script de mesure d'audience de Vercel. Il faut activer « Web Analytics » dans le projet Vercel, puis définir
 * NEXT_PUBLIC_ANALYTICS=vercel : sans cela, le script n'existe pas et le navigateur signalerait une erreur 404.
 * Il ne se charge qu'avec l'accord de la personne (produit Consentement) : sans accord, `window.va` n'existe pas et `suivre` ne fait rien.
 */
export default function Analytics() {
  const { choix } = useConsentement();
  if (!mesureActive(INSTANCE.refonte) || choix !== "accepte") return null;
  return (
    <>
      <Script id="va-init" strategy="afterInteractive">
        {"window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};"}
      </Script>
      <Script src="/_vercel/insights/script.js" strategy="afterInteractive" defer />
    </>
  );
}
