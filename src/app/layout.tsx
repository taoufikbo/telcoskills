import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import { Bandeau } from "@/produits/consentement";
import { Analytics, mesureActive } from "@/produits/mesure";
import { BoutonRecherche, RecherchePalette } from "@/produits/recherche";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import ThemeToggle from "@/components/ThemeToggle";
import { INSTANCE } from "@/lib/instance";
import { chargerProjets } from "@/lib/projets";
import { SCRIPT_THEME } from "@/lib/useTheme";
import "./globals.css";
import { BASE_SITE } from "@/lib/site";
import { EncartInscription } from "@/produits/inscription";

const geist = localFont({ src: "../fonts/Geist-Variable.woff2", variable: "--font-geist", weight: "100 900", display: "swap" });
const geistMono = localFont({ src: "../fonts/GeistMono-Variable.woff2", variable: "--font-geist-mono", weight: "100 900", display: "swap" });

const DESCRIPTION = INSTANCE.description;

export const metadata: Metadata = {
  // Même source que le plan du site et les images de partage (src/lib/site.ts) : telcoskills.com en production.
  metadataBase: new URL(BASE_SITE),
  title: { default: INSTANCE.nom, template: `%s · ${INSTANCE.nom}` },
  description: DESCRIPTION,
  openGraph: { type: "website", locale: "fr_FR", siteName: INSTANCE.nom, title: INSTANCE.nom, description: DESCRIPTION },
  twitter: { card: "summary_large_image" },
  robots: INSTANCE.indexable ? undefined : { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const refonte = INSTANCE.refonte;
  return (
    <html
      lang="fr"
      data-instance={INSTANCE.id}
      className={refonte ? `${geist.variable} ${geistMono.variable}` : undefined}
      // L'instance publique pilote son accent par ses jetons CSS (clair et sombre) ; l'ancienne, par cette variable.
      style={refonte ? undefined : { ["--accent" as string]: INSTANCE.accent }}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_THEME }} />
      </head>
      <body>
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:bg-orange focus:p-2 focus:font-bold focus:text-black"
        >
          Aller au contenu
        </a>
        <SiteHeader />
        <div id="contenu" tabIndex={-1} className="outline-none">
          {children}
        </div>
        {refonte && <SiteFooter />}
        <RecherchePalette />
        {refonte && INSTANCE.inscription && <EncartInscription action={INSTANCE.inscription.action} champEmail={INSTANCE.inscription.champEmail} />}
        <Analytics />
        {mesureActive(refonte) && <Bandeau />}
      </body>
    </html>
  );
}
