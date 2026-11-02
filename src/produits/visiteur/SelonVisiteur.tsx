"use client";

import { useState, type ReactNode } from "react";
import type { EtatVisiteur } from "./etat";
import { useVisiteur } from "./useVisiteur";

/**
 * Affiche l'un ou l'autre contenu selon l'état du visiteur **à son arrivée sur la page** : terminer le diagnostic ou marquer
 * une compétence pendant la visite ne fait pas basculer la page sous ses yeux (le résultat qu'il vient d'obtenir resterait masqué).
 * Tant que l'état est inconnu (rendu serveur, sans JavaScript), c'est le contenu « nouveau » : la page reste complète seule.
 */
export default function SelonVisiteur({ nouveau, revenant }: { nouveau: ReactNode; revenant: ReactNode }) {
  const actuel = useVisiteur();
  const [arrivee, setArrivee] = useState<EtatVisiteur>("inconnu");
  // Ajustement pendant le rendu (et non dans un effet) : l'état d'arrivée est fixé au premier rendu où le stockage est lu.
  if (arrivee === "inconnu" && actuel !== "inconnu") setArrivee(actuel);
  return <>{arrivee === "revenant" ? revenant : nouveau}</>;
}
