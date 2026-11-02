"use client";

import { useState, useSyncExternalStore } from "react";
import { EVENEMENTS, suivre } from "./analytics";

const active = () => typeof window !== "undefined" && typeof window.va === "function";

/** Page d'essai : la mesure est-elle active ici, quels événements existent, et l'envoi d'un événement d'essai. */
export default function LaboMesure() {
  const actif = useSyncExternalStore(() => () => {}, active, () => false);
  const [envoye, setEnvoye] = useState("");
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold">Mesure</h1>
      <p data-etat-mesure>
        Mesure {actif ? "active" : "inactive"} sur cette page{" "}
        <span className="mono">(active seulement en production avec NEXT_PUBLIC_ANALYTICS=vercel ; sinon rien ne part)</span>
      </p>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => {
          suivre("cta_clic", { emplacement: "labo" });
          setEnvoye(actif ? "Événement « cta_clic » envoyé." : "Mesure inactive : rien n'a été envoyé.");
        }}
      >
        Envoyer un événement d&apos;essai
      </button>
      <p className="mono" aria-live="polite">
        {envoye}
      </p>
      <h2 className="text-xl font-semibold">Événements autorisés ({EVENEMENTS.length})</h2>
      <ul className="mono columns-2 sm:columns-3">
        {EVENEMENTS.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    </section>
  );
}
