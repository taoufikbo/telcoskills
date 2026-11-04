"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LienSuivi } from "@/produits/mesure";

/** Un lien de la navigation : [libellé, adresse, autres préfixes où il est actif]. La liste est filtrée côté serveur (SiteHeader). */
export type Lien = readonly [libelle: string, href: string, alias?: readonly string[]];

/** Logo « in » de LinkedIn (Simple Icons, domaine public). */
const LOGO_LINKEDIN =
  "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z";

/** Contact : un petit logo LinkedIn discret quand le profil est renseigné ; sinon, le lien vers la page de contact. */
const contact = (linkedin: string | null, emplacement: string, className: string, avecLibelle = false) =>
  linkedin ? (
    <LienSuivi href={linkedin} externe evenement="contact_clic" donnees={{ canal: "linkedin", emplacement }} className={`${className} inline-flex items-center gap-2`} aria-label="Profil LinkedIn (nouvel onglet)" title="LinkedIn">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
        <path d={LOGO_LINKEDIN} />
      </svg>
      {avecLibelle && "LinkedIn"}
    </LienSuivi>
  ) : (
    <LienSuivi href="/contact" evenement="cta_clic" donnees={{ emplacement }} className={className}>
      Prendre contact
    </LienSuivi>
  );

/**
 * Navigation principale. Écran large : les liens en ligne, et le logo LinkedIn à droite.
 * Écran étroit : l'en-tête tient sur une ligne ; les liens sont repliés derrière « Menu » et se referment à chaque changement de page.
 */
export default function NavPrincipale({ liens: LIENS, contact: avecContact, linkedin = null }: { liens: readonly Lien[]; contact: boolean; linkedin?: string | null }) {
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
      {(avecContact || linkedin) && <div className="order-4 hidden md:block">{contact(linkedin, "en-tete", "nav-lien")}</div>}
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
          {(avecContact || linkedin) && contact(linkedin, "menu-mobile", "nav-lien py-2 text-base", true)}
        </nav>
      )}
    </>
  );
}
