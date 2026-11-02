"use client";

import { useConsentement } from "./useConsentement";

/** « Gérer mes choix » : pour changer d'avis à tout moment (efface le choix, le bandeau revient). */
export default function LienChoix({ className }: { className?: string }) {
  const { rouvrir } = useConsentement();
  return (
    <button type="button" onClick={rouvrir} className={className ?? "underline"}>
      Gérer mes choix
    </button>
  );
}
