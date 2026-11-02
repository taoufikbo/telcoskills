import type { Index, Liens, Selection, TypeEntite } from "@/lib/carte";
import type { ProjetResolu } from "@/lib/projet-schema";
import type { Statut } from "@/produits/progression";
import type { RessourceApprentissage } from "@/lib/projets";

/** Statut d'une compétence pour le profil choisi ; « hors » : absente de la roadmap du rôle ; null : pas de profil. */
export type EtatCompetence = Statut | "hors" | null;

/** Contexte partagé par les trois vues et le panneau : une seule sélection, éclairée partout. */
export type Ctx = {
  projet: ProjetResolu;
  index: Index;
  sel: Selection;
  liens: Liens | null;
  apprentissage: Record<string, RessourceApprentissage[]>;
  choisir: (s: Selection) => void;
  /** Vrai si l'entité est liée à la sélection (ou s'il n'y a pas de sélection). */
  actif: (type: TypeEntite, id: string) => boolean;
  estSel: (type: TypeEntite, id: string) => boolean;
  etatCompetence: (id: string) => EtatCompetence;
  profil: { id: string; libelle: string; roadmapId?: string } | null;
  choisirProfil: (id: string | null) => void;
  /** Progression du profil sur les compétences d'un ensemble : { maitrisees, evaluables }. */
  preparation: (competences: string[]) => { maitrisees: number; evaluables: number; hors: number } | null;
};

/** Aspect d'une entité selon qu'elle est liée à la sélection ou choisie. */
export const aspect = (actif: boolean, selectionne: boolean) =>
  `transition-opacity ${actif ? "" : "opacity-25"} ${selectionne ? "outline outline-[3px] outline-offset-1 outline-black dark:outline-white" : ""}`;
