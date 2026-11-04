"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { libelleDuree } from "@/lib/duree";
import { prochaineQuestion, recommander, reponsesValides, type Orientation, type Reponses } from "@/lib/orientation-schema";
import { urlNoeud, urlRoadmap } from "@/lib/urls";
import { ANCRE_DIAGNOSTIC, PARAM_PROFIL, decoderProfil, encoderProfil } from "@/produits/diagnostic";
import { suivre } from "@/produits/mesure";
import { enregistrerReponses } from "@/produits/parcours";

type Props = {
  config: Orientation;
  parcours: Record<string, { titre: string }>;
  /** Titre du nœud de départ, par « parcours/nœud ». */
  titresNoeuds: Record<string, string>;
  /** Heures du nœud de départ, par « parcours/nœud ». */
  durees: Record<string, { noeud: number }>;
  /** Réponses données jusqu'ici : la page en déduit le parcours probable. */
  onBrouillon: (reponses: Partial<Reponses>) => void;
  /** Parcours et premier pas recommandés une fois les trois réponses données (null quand on recommence). */
  onResultat: (reco: { roadmapId: string; noeudId: string } | null) => void;
};

const sansAbonnement = () => () => {};
const lireProfil = () => (typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get(PARAM_PROFIL) ?? "");
const abonnerUrl = (cb: () => void) => {
  window.addEventListener("popstate", cb);
  return () => window.removeEventListener("popstate", cb);
};

type Message = { auteur: "assistant" | "vous"; texte: string };

/**
 * Entrée de l'accueil : une conversation scriptée, sans intelligence artificielle. Les questions et les réponses
 * viennent de content/orientation.json ; chaque réponse est un bouton. Même calcul que le diagnostic, présenté comme une
 * discussion : c'est elle qui choisit le parcours, la carte voisine le dessine.
 */
export default function ConversationParcours({ config, parcours, titresNoeuds, durees, onBrouillon, onResultat }: Props) {
  const [locales, setLocales] = useState<Partial<Reponses>>({});
  const [enAttente, setEnAttente] = useState(false);
  const [copie, setCopie] = useState(false);
  const profilUrl = useSyncExternalStore(abonnerUrl, lireProfil, () => "");
  const partagees = useMemo(() => decoderProfil(config, profilUrl), [config, profilUrl]);
  const reponses: Partial<Reponses> = partagees ?? locales;
  const termine = reponsesValides(config, reponses);
  const reco = termine ? recommander(config, reponses) : null;
  const question = prochaineQuestion(config, reponses);

  const aInteragi = useRef(false);
  const commence = useRef(false);
  const fil = useRef<HTMLDivElement>(null);
  const groupe = useRef<HTMLDivElement>(null);
  const titreResultat = useRef<HTMLHeadingElement>(null);

  // La page (carte du hero) suit le parcours recommandé, y compris pour un résultat partagé par lien.
  const cle = reco ? `${reco.roadmapId}/${reco.noeudId}` : "";
  useEffect(() => {
    onResultat(reco ? { roadmapId: reco.roadmapId, noeudId: reco.noeudId } : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seule la clé du résultat compte, pas l'identité de l'objet
  }, [cle]);

  // Le « … » de l'assistant dure un instant, puis la question apparaît.
  useEffect(() => {
    if (!enAttente) return;
    const t = setTimeout(() => setEnAttente(false), 650);
    return () => clearTimeout(t);
  }, [enAttente]);

  // Après une interaction : défilement du fil, puis focus sur la première réponse proposée (ou sur le résultat).
  const nbRepondues = config.questions.filter((q) => reponses[q.id]).length;
  useEffect(() => {
    if (!aInteragi.current) return;
    const el = fil.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    if (enAttente) return;
    if (termine) titreResultat.current?.focus();
    else groupe.current?.querySelector("button")?.focus();
  }, [nbRepondues, enAttente, termine]);

  const repondre = (id: keyof Reponses, optionId: string) => {
    aInteragi.current = true;
    if (!commence.current) {
      commence.current = true;
      suivre("quiz_start");
    }
    const suite = { ...locales, [id]: optionId };
    setLocales(suite);
    onBrouillon(suite);
    setEnAttente(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (reponsesValides(config, suite)) {
      suivre("quiz_complete", { metier: suite.metier, parcours: recommander(config, suite).roadmapId });
      enregistrerReponses(suite);
    }
  };
  const recommencer = () => {
    aInteragi.current = true;
    if (profilUrl) {
      window.history.replaceState(null, "", `${window.location.pathname}#${ANCRE_DIAGNOSTIC}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
    commence.current = false;
    setLocales({});
    setCopie(false);
    setEnAttente(false);
    onBrouillon({});
    enregistrerReponses(null);
  };
  const copier = async () => {
    if (!termine) return;
    const lien = `${window.location.origin}${window.location.pathname}?${PARAM_PROFIL}=${encoderProfil(reponses as Reponses)}#${ANCRE_DIAGNOSTIC}`;
    try {
      await navigator.clipboard.writeText(lien);
      setCopie(true);
    } catch {
      window.prompt("Copiez ce lien :", lien);
    }
  };

  const messages: Message[] = [{ auteur: "assistant", texte: "Bonjour. Dites-moi votre métier : je vous propose un parcours et un premier pas, en trois questions." }];
  for (const q of config.questions) {
    const option = q.options.find((o) => o.id === reponses[q.id]);
    if (!option) break;
    messages.push({ auteur: "assistant", texte: q.question }, { auteur: "vous", texte: option.libelle });
  }
  const noeud = reco ? titresNoeuds[`${reco.roadmapId}/${reco.noeudId}`] : "";
  const depart = reco ? durees[`${reco.roadmapId}/${reco.noeudId}`] : undefined;

  return (
    <section aria-labelledby="titre-conversation" className="panneau overflow-hidden">
      <header className="flex items-center gap-3 border-b px-4 py-3 sm:px-5" style={{ borderColor: "var(--filet)" }}>
        <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold" style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
          T
        </span>
        <h2 id="titre-conversation" className="flex-1 text-sm font-semibold leading-tight">
          Trouver mon parcours
        </h2>
        {(nbRepondues > 0 || termine) && (
          <button type="button" onClick={recommencer} className="mono underline underline-offset-4" style={{ fontSize: "0.75rem" }}>
            Recommencer
          </button>
        )}
      </header>

      <div ref={fil} role="log" aria-live="polite" aria-label="Conversation" className="max-h-[36rem] space-y-3 overflow-y-auto p-4 sm:p-5">
        {messages.map((m, i) => (
          <p
            key={i}
            className={`w-fit max-w-[90%] rounded-lg px-3 py-2 text-sm ${m.auteur === "vous" ? "ml-auto" : ""}`}
            style={m.auteur === "vous" ? { background: "var(--accent)", color: "var(--accent-fg)" } : { background: "var(--surface-2)" }}
          >
            {m.texte}
          </p>
        ))}

        {enAttente && (
          <p className="w-fit rounded-lg px-3 py-3" style={{ background: "var(--surface-2)" }} aria-label="L'assistant écrit">
            <span aria-hidden="true" className="points-saisie">
              <i />
              <i />
              <i />
            </span>
          </p>
        )}

        {!enAttente && question && (
          <div ref={groupe} className="space-y-3">
            <p className="w-fit max-w-[90%] rounded-lg px-3 py-2 text-sm" style={{ background: "var(--surface-2)" }}>
              {question.question}
            </p>
            {question.aide && (
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {question.aide}
              </p>
            )}
            <div className="flex flex-wrap gap-2" role="group" aria-label={question.question}>
              {question.options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => repondre(question.id, o.id)}
                  className="rounded-full border px-3 py-1.5 text-left text-sm transition-colors hover:bg-[var(--surface-2)]"
                  style={{ borderColor: "var(--bord)" }}
                >
                  {o.libelle}
                </button>
              ))}
            </div>
          </div>
        )}

        {!enAttente && reco && (
          <div className="space-y-3 rounded-lg border p-3" style={{ borderColor: "var(--filet)" }}>
            <p className="mono" style={{ fontSize: "0.75rem" }}>
              Votre parcours
            </p>
            <h3 ref={titreResultat} tabIndex={-1} className="text-lg font-semibold outline-none">
              {parcours[reco.roadmapId].titre}
            </h3>
            <ul className="list-disc space-y-1 pl-5 text-sm" style={{ color: "var(--muted)" }}>
              {reco.raisons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <p className="text-sm">
              <span className="mono" style={{ fontSize: "0.75rem" }}>
                Premier pas
              </span>
              <br />
              <strong>{noeud}</strong>
              {depart && <span style={{ color: "var(--muted)" }}> : {libelleDuree(depart.noeud)}</span>}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href={urlNoeud(reco.roadmapId, reco.noeudId)} className="btn btn-primary">
                Commencer par « {noeud} »
              </Link>
              <Link href={urlRoadmap(reco.roadmapId)} className="text-sm underline underline-offset-4">
                Voir tout le parcours
              </Link>
            </div>
            <p className="text-sm">
              <button type="button" onClick={copier} className="underline underline-offset-4">
                Copier le lien de ce résultat
              </button>
              <span role="status" className="ml-2" style={{ color: "var(--muted)" }}>
                {copie ? "Lien copié." : ""}
              </span>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
