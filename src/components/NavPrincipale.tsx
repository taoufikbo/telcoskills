"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LienSuivi } from "@/produits/mesure";

/** Un lien de la navigation : [libellé, adresse, autres préfixes où il est actif]. La liste est filtrée côté serveur (SiteHeader). */
export type Lien = readonly [libelle: string, href: string, alias?: readonly string[]];

const contact = (emplacement: string, className: string) => (
  <LienSuivi href="/contact" evenement="cta_clic" donnees={{ emplacement }} className={className}>
    Prendre contact
  </LienSuivi>
);

/**
 * Navigation principale. Écran large : les liens en ligne, et « Prendre contact » en simple lien à droite.
 * Écran étroit : l'en-tête tient sur une ligne ; les liens sont repliés derrière « Menu » et se referment à chaque changement de page.
 */
export default function NavPrincipale({ liens: LIENS, contact: avecContact }: { liens: readonly Lien[]; contact: boolean }) {
  const chemin = usePathname();
  // Le menu est ouvert « pour » une page : naviguer le referme sans effet de bord.
  const [ouvertSur, setOuvertSur] = useState<string | null>(null);
  const ouvert = ouvertSur === chemin;
  // Lien actif : l'entrée la plus précise qui contient la page (sur /ressources/landscape, « Landscape » et non « Ressources »).
  const actif = LIENS.flatMap(([, href, alias = []]) => [href, ...alias].map((prefixe) => ({ href, prefixe })))
    .filter(({ prefixe }) => chemin === prefixe || chemin.startsWith(`${prefixe}/`))
    .sort((a, b) => b.prefixe.length - a.prefixe.length)[0]?.href;
  const liens = (classe: string) =>
    LIENS.map(([libelle, href]) => (
      <Link key={href} href={href} className={classe} aria-current={href === actif ? "page" : undefined}>
        {libelle}
      </Link>
    ));

  return (
    <>
      <nav aria-label="Navigation principale" className="order-2 hidden items-center gap-x-5 md:flex">
        {liens("nav-lien")}
      </nav>
      {avecContact && <div className="order-4 hidden md:block">{contact("en-tete", "nav-lien")}</div>}
      <button
        type="button"
        className="nav-lien order-2 ml-auto md:hidden"
        aria-expanded={ouvert}
        aria-controls="menu-mobile"
        onClick={() => setOuvertSur(ouvert ? null : chemin)}
      >
        {ouvert ? "Fermer" : "Menu"}
      </button>
      {ouvert && (
        <nav id="menu-mobile" aria-label="Navigation principale" className="order-last flex w-full flex-col gap-1 border-t pb-2 pt-3 md:hidden" style={{ borderColor: "var(--filet)" }}>
          {liens("nav-lien py-2 text-base")}
          {avecContact && contact("menu-mobile", "nav-lien py-2 text-base")}
        </nav>
      )}
    </>
  );
}
