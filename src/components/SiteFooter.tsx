import Link from "next/link";
import Marque from "@/components/Marque";
import { LienChoix } from "@/produits/consentement";
import { mesureActive } from "@/produits/mesure";
import { depotPublic } from "@/lib/contribution";
import { INSTANCE } from "@/lib/instance";
import { lienVisible, sectionsVisibles } from "@/lib/sections";
import { BASE_PROJET, BASE_ROADMAPS } from "@/lib/urls";

const COLONNES = [
  {
    titre: "Explorer",
    liens: [
      ["Analyses", "/analyses"],
      ["Frameworks", "/frameworks"],
      ["Roadmaps", BASE_ROADMAPS],
      ["Projet fil rouge", BASE_PROJET],
      ["Landscape", "/ressources/landscape"],
      ["Parcours Sylva", "/sylva"],
    ],
  },
  {
    titre: "Travailler ensemble",
    liens: [
      ["Offres", "/offres"],
      ["Diagnostic d'équipe", "/diagnostic"],
      ["Prendre contact", "/contact"],
      ["Newsletter", "/newsletter"],
    ],
  },
  {
    titre: "Le site",
    liens: [
      ["À propos et méthode", "/a-propos"],
      ["Mentions légales", "/mentions-legales"],
      ["Confidentialité", "/confidentialite"],
    ],
  },
] as const;

export default async function SiteFooter() {
  // Pas de lien vers une page « en cours de rédaction » (spécification, critère 5) ; une colonne vide disparaît.
  const sections = await sectionsVisibles();
  const colonnes = COLONNES.map((c) => ({ ...c, liens: c.liens.filter(([, href]) => lienVisible(sections, href)) })).filter((c) => c.liens.length > 0);
  return (
    <footer className="site-footer mt-24 border-t" style={{ borderColor: "var(--filet)" }}>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="space-y-3">
          <p className="marque">
            <Marque />
            {INSTANCE.nom}
          </p>
          <p className="max-w-xs text-sm" style={{ color: "var(--muted)" }}>
            {INSTANCE.description}
          </p>
        </div>
        {colonnes.map((c) => (
          <nav key={c.titre} aria-label={c.titre}>
            <h2 className="mono mb-3">{c.titre}</h2>
            <ul className="space-y-2 text-sm">
              {c.liens.map(([libelle, href]) => (
                <li key={href}>
                  <Link href={href} className="hover:underline">
                    {libelle}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <p className="mono mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        © {new Date().getFullYear()} {INSTANCE.nom}
        {depotPublic() && (
          <>
            {" · "}
            <a href={depotPublic()!} target="_blank" rel="noopener noreferrer" className="underline">
              Contribuer sur GitHub
            </a>
          </>
        )}
        {mesureActive(INSTANCE.refonte) && (
          <>
            {" · "}
            <LienChoix />
          </>
        )}
      </p>
    </footer>
  );
}
