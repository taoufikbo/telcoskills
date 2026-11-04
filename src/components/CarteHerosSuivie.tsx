"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { CarteDepart } from "@/lib/cartesDeparts";
import { recommander, reponsesValides, type Orientation } from "@/lib/orientation-schema";
import { CarteHeros, type Disposition } from "@/produits/carte-heros";
import { useReponsesEnregistrees } from "@/produits/parcours";
import { usePratique, vueProgression } from "@/produits/progression";

type Props = {
  /** Carte affichée tant que la personne n'a pas de parcours (et au rendu serveur). Sans elle, rien n'est affiché dans ce cas. */
  defaut?: Disposition;
  config: Orientation;
  /** Point de départ imposé (résultat affiché du diagnostic) ; sinon, celui des réponses enregistrées. */
  choix?: { roadmapId: string; noeudId: string };
  /** Légende de la carte par défaut, masquée quand la carte devient celle de la personne. */
  legendeDefaut?: ReactNode;
  /** Parcours probable pendant le diagnostic (après la première réponse) : la carte montre son chemin depuis le début, avant que les trois réponses ne soient données. */
  apercu?: string | null;
  /** L'aperçu est un exemple joué par la page (et non une réponse du visiteur) : la légende le dit. */
  exemple?: boolean;
};

let promesse: Promise<Record<string, CarteDepart>> | null = null;
/** Une seule requête par page, partagée entre les cartes (en-tête et résultat du diagnostic). */
const chargerCartes = () => (promesse ??= fetch("/cartes-parcours.json").then((r) => (r.ok ? r.json() : {})));

/**
 * Raccord de page (pas un produit) : choisit quelle carte montrer et lui passe la progression en lecture seule.
 * Après le diagnostic, la carte se redessine : le chemin de la personne, de son point de départ à la compétence la plus avancée
 * qui s'appuie dessus. La Carte héros elle-même n'accède à aucun stockage.
 */
export default function CarteHerosSuivie({ defaut, config, choix, legendeDefaut, apercu, exemple }: Props) {
  const { etat, now, pret } = usePratique();
  const { reponses } = useReponsesEnregistrees();
  const [cartes, setCartes] = useState<Record<string, CarteDepart> | null>(null);

  const cle = useMemo(() => {
    if (choix) return `${choix.roadmapId}/${choix.noeudId}`;
    if (!reponsesValides(config, reponses)) return apercu && config.premiers_noeuds[apercu] ? `${apercu}/${config.premiers_noeuds[apercu].aucune}` : null;
    const r = recommander(config, reponses);
    return `${r.roadmapId}/${r.noeudId}`;
  }, [choix, config, reponses, apercu]);

  useEffect(() => {
    if (!cle || cartes) return;
    let actif = true;
    chargerCartes()
      .then((c) => actif && setCartes(c))
      .catch(() => {
        // hors ligne : la carte par défaut reste affichée
      });
    return () => {
      actif = false;
    };
  }, [cle, cartes]);

  const perso = cle && cartes ? cartes[cle] : undefined;
  const disposition = perso?.disposition ?? defaut;
  const progression = useMemo(
    () => (pret && disposition ? vueProgression(etat, { id: disposition.roadmapId, noeuds: disposition.noeuds }, now) : {}),
    [pret, etat, now, disposition],
  );
  if (!disposition) return null;
  return (
    <div key={perso ? cle : "defaut"} className={perso ? "carte-apparait" : undefined}>
      {perso && (
        <p className="mono mb-2" data-carte-perso>
          {reponsesValides(config, reponses) || choix ? "Votre chemin dans" : exemple ? "Exemple :" : "Parcours probable :"} « {perso.titreRoadmap} »
        </p>
      )}
      <CarteHeros disposition={disposition} progression={progression} />
      {!perso && legendeDefaut}
    </div>
  );
}
