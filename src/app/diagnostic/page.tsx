import type { Metadata } from "next";
import Diagnostic from "@/components/Diagnostic";
import { BROUILLONS_VISIBLES } from "@/components/Draft";
import PageEbauche from "@/components/PageEbauche";
import { chargerDiagnostic } from "@/lib/diagnostic";
import { roadmapDeReference } from "@/lib/noeuds";
import { chargerOrientation } from "@/lib/orientation";
import { exigerRefonte } from "@/lib/refonte";
import { contactDisponible } from "@/lib/sections";
import { chargerRoadmaps, getRoadmap } from "@/lib/roadmaps";
import { urlNoeud } from "@/lib/urls";

const donnees = chargerDiagnostic();

export const metadata: Metadata = {
  title: "Diagnostic d'équipe",
  description: "Auto-diagnostic de la maturité d'une équipe plateforme télécom, en douze questions. Le calcul se fait dans votre navigateur.",
  robots: donnees.brouillon ? { index: false } : undefined,
};

export default function PageDiagnostic() {
  exigerRefonte();
  const intro = "Auto-diagnostic de la maturité d'une équipe plateforme télécom.";
  // Tant que les questions sont un brouillon, elles ne sont visibles qu'en développement et en aperçu.
  if (donnees.brouillon && !BROUILLONS_VISIBLES) return <PageEbauche titre="Diagnostic d'équipe" intro={intro} />;

  const roadmaps = chargerRoadmaps();
  const ordre = chargerOrientation().ordre;
  const liens: Record<string, { titre: string; href: string }> = {};
  for (const b of donnees.blocs)
    for (const id of b.noeuds) {
      const ref = roadmapDeReference(roadmaps, id, ordre);
      const titre = ref ? getRoadmap(ref)?.noeuds.find((n) => n.id === id)?.titre : undefined;
      if (ref && titre) liens[id] = { titre, href: urlNoeud(ref, id) };
    }

  return (
    <PageEbauche titre="Diagnostic d'équipe" intro={`${intro} ${donnees.questions.length} questions, pas de compte : le calcul se fait dans votre navigateur et rien n'est envoyé.`} enCours={false}>
      {donnees.brouillon && (
        <p className="mono" data-draft style={{ padding: "0.75rem" }}>
          Brouillon : questions et grille de score à relire (content/diagnostic.json).
        </p>
      )}
      <Diagnostic donnees={donnees} liens={liens} contact={contactDisponible()} />
    </PageEbauche>
  );
}
