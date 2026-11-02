import type { Metadata } from "next";
import { EncartInscription } from "@/produits/inscription";

export const metadata: Metadata = { title: "Labo : Inscription" };

export default function Page() {
  return (
    <>
      <h1 className="text-3xl font-semibold">Inscription</h1>
      <p className="mono">Encart forcé (envoi neutralisé). Sur le site, il n&apos;apparaît qu&apos;après le choix d&apos;un parcours ou à la 3e page, et seulement si un service d&apos;envoi est configuré.</p>
      <EncartInscription action="#" champEmail="email" essai />
    </>
  );
}
