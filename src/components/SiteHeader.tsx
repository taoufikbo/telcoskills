import Link from "next/link";
import Marque from "@/components/Marque";
import NavPrincipale from "@/components/NavPrincipale";
import { BoutonRecherche } from "@/produits/recherche";
import ThemeToggle from "@/components/ThemeToggle";
import { INSTANCE } from "@/lib/instance";
import { lienVisible, sectionsVisibles } from "@/lib/sections";

/**
 * En-tête de l'instance publique : marque, navigation, recherche, thème. Aucun bouton plein : l'action principale appartient à la page.
 * Sur mobile, une seule ligne (marque, « Menu », thème).
 */
/** Liens de la navigation, dans l'ordre ; filtrés (src/lib/sections.ts) pour ne jamais mener à une page en cours de rédaction. */
const LIENS_NAVIGATION = [
  ["Analyses", "/analyses"],
  ["Frameworks", "/frameworks"],
  ["Ressources", "/ressources"],
  ["Landscape", "/ressources/landscape"],
  ["Parcours Sylva", "/sylva", ["/ressources/roadmaps/parcours-sylva"]],
  ["Offres", "/offres"],
  ["À propos", "/a-propos"],
] as const;

export default async function SiteHeader() {
  const sections = await sectionsVisibles();
  return (
    <header className="site-header">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="marque order-1" aria-label={`${INSTANCE.nom}, accueil`}>
          <Marque />
          {INSTANCE.nom}
        </Link>
        <NavPrincipale liens={LIENS_NAVIGATION.filter(([, href]) => lienVisible(sections, href))} contact={sections.contact} linkedin={INSTANCE.auteur.linkedin} />
        <div className="order-3 flex items-center gap-3 md:ml-auto">
          <BoutonRecherche surNoir={false} className="hidden w-44 lg:flex" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
