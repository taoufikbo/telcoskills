/**
 * Instance du site : un seul moteur, plusieurs déploiements.
 * Chaque projet Vercel fixe NEXT_PUBLIC_INSTANCE (valeur inlinée au build, donc utilisable côté client).
 *   - « interne » (défaut) : le site historique, charte orange, non indexé.
 *   - « public » : le site d'expertise (nouvelle architecture d'information, voir reports/plan.md).
 * Les champs `null` sont des valeurs à fournir : le site affiche un brouillon à la place, jamais une valeur inventée.
 */
export type Instance = {
  id: "interne" | "public";
  /** Nom complet, affiché en en-tête (écran large), dans les titres et l'image de partage. */
  nom: string;
  /** Nom court, en-tête sur mobile. */
  court: string;
  description: string;
  /** Couleur d'accent (hex) : alimente la classe « orange », les graphes et l'image de partage. */
  accent: string;
  /** Faux : demande aux moteurs de recherche de ne pas indexer le site. */
  indexable: boolean;
  /** Vrai : nouvelle architecture d'information (/ressources, /analyses, …) ; faux : routes historiques. */
  refonte: boolean;
  auteur: {
    nom: string;
    /** Vrai tant que le nom est un nom de substitution : pas de page auteur nominative ni de JSON-LD « Person ». */
    fictif: boolean;
    bioCourte: string | null;
    linkedin: string | null;
  };
  contact: { calendlyUrl: string | null; email: string | null };
  newsletterUrl: string | null;
  /** Adresse canonique du site en production (liens canoniques, plan du site, images de partage) ; null : celle fournie par Vercel. */
  url: string | null;
  /**
   * Dépôt de code pour l'appel à contribution. Les liens (pied de page, « proposer une correction » sur les compétences)
   * n'apparaissent que si `public` est vrai : tant que le dépôt est privé, ils mèneraient à une page 404.
   */
  depot: { url: string; public: boolean } | null;
  /**
   * Service d'envoi des mises à jour (formulaire POST : Brevo, Buttondown…). null : l'encart d'inscription n'apparaît pas.
   * `champEmail` : nom du champ attendu par le service (« EMAIL » pour Brevo, « email » pour Buttondown).
   */
  inscription: { action: string; champEmail: string } | null;
};

const SANS_CONTACT = { calendlyUrl: null, email: null };

const INSTANCES: Record<Instance["id"], Instance> = {
  interne: {
    id: "interne",
    nom: "TelcoCloud Roadmaps",
    court: "TelcoCloud",
    description: "Roadmaps de compétences pour le cloud télécom et l'IA : un parcours par métier et un projet fil rouge.",
    accent: "#ff7900",
    indexable: false,
    refonte: false,
    auteur: { nom: "", fictif: true, bioCourte: null, linkedin: null },
    contact: SANS_CONTACT,
    newsletterUrl: null,
    url: null,
    depot: null,
    inscription: null,
  },
  public: {
    id: "public",
    // Nom et domaine retenus le 2026-11-02 (telcoskills.com, telcoskills.fr redirigé). Un seul endroit à modifier.
    nom: "TelcoSkills",
    court: "TelcoSkills",
    description: "Les compétences du cloud télécom et de l'IA : un parcours par métier, le landscape des outils et le parcours Sylva.",
    accent: "#3b82f6",
    indexable: true,
    refonte: true,
    // Bio courte et LinkedIn : à fournir par l'auteur (la page À propos garde un emplacement de brouillon, invisible en production).
    auteur: { nom: "Taoufik Bouazza", fictif: false, bioCourte: null, linkedin: null },
    contact: SANS_CONTACT,
    newsletterUrl: null,
    // Explicite : avec deux domaines de même longueur (.com et .fr), Vercel pourrait désigner l'un ou l'autre.
    url: "https://telcoskills.com",
    // Dépôt public (appel à contribution) : liens « Contribuer » en pied de page et « Proposer une correction » sur les compétences.
    depot: { url: "https://github.com/taoufikbo/telcoskills", public: true },
    // À renseigner avec l'adresse du formulaire créé chez le service d'envoi (voir HANDOFF.md, point 9).
    inscription: null,
  },
};

export const INSTANCE: Instance = INSTANCES[(process.env.NEXT_PUBLIC_INSTANCE as Instance["id"]) ?? "public"] ?? INSTANCES.public;
