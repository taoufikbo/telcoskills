"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { Etape } from "@/lib/chaine";
import { INSTANCE } from "@/lib/instance";
import { urlProjet } from "@/lib/urls";

export type RoleChaine = { id: string; libelle: string };
type Props = { etapes: Etape[]; roles: RoleChaine[]; projetId: string };

/** Couleurs des rôles (palette de la charte). Les rôles inconnus retombent sur le blanc. */
const COULEURS: Record<string, string> = {
  "chef-projet": "#ffcc00",
  architecte: "#4170d8",
  "ingenieur-caas": "#4bb4e6",
  "integrateur-nf": INSTANCE.accent,
  devops: "#66cc66",
  sre: "#ffb4e6",
  "ingenieur-ia": "#a885d8",
  securite: "#ff7a5c",
  reseau: "#ffffff",
  editeur: "#999999",
  juridique: "#228722",
};

const court = (libelle: string) => libelle.split(" / ")[0];

/** Pictogrammes au trait, sur une grille de 48 : un par étape. */
const PICTOS: Record<Etape["icone"], ReactNode> = {
  cible: (
    <>
      <circle cx="24" cy="24" r="17" />
      <circle cx="24" cy="24" r="9" />
      <circle cx="24" cy="24" r="2.5" fill="currentColor" />
    </>
  ),
  plan: (
    <>
      <rect x="8" y="8" width="32" height="32" />
      <path d="M8 20H40M20 20V40M28 28H34" />
    </>
  ),
  serveur: (
    <>
      <rect x="8" y="8" width="32" height="9" />
      <rect x="8" y="20" width="32" height="9" />
      <rect x="8" y="32" width="32" height="9" />
      <path d="M14 12.5h2M14 24.5h2M14 36.5h2M30 12.5h6M30 24.5h6M30 36.5h6" />
    </>
  ),
  reseau: (
    <>
      <rect x="18" y="6" width="12" height="10" />
      <rect x="5" y="32" width="12" height="10" />
      <rect x="31" y="32" width="12" height="10" />
      <path d="M24 16V24M11 32V24H37V32" />
    </>
  ),
  cluster: (
    <>
      <rect x="7" y="7" width="15" height="15" />
      <rect x="26" y="7" width="15" height="15" />
      <rect x="7" y="26" width="15" height="15" />
      <rect x="26" y="26" width="15" height="15" />
      <path d="M22 14.5h4M22 33.5h4M14.5 22v4M33.5 22v4" />
    </>
  ),
  puce: (
    <>
      <rect x="13" y="13" width="22" height="22" />
      <rect x="19" y="19" width="10" height="10" fill="currentColor" />
      <path d="M19 13V6M29 13V6M19 42v-7M29 42v-7M13 19H6M13 29H6M42 19h-7M42 29h-7" />
    </>
  ),
  bouclier: (
    <>
      <path d="M24 5L40 11V23C40 33 33 40 24 43C15 40 8 33 8 23V11Z" />
      <path d="M16 24l6 6 11-12" />
    </>
  ),
  paquets: (
    <>
      <path d="M24 5L41 14V34L24 43L7 34V14Z" />
      <path d="M7 14L24 24L41 14M24 24V43" />
    </>
  ),
  test: (
    <>
      <rect x="9" y="7" width="30" height="34" />
      <path d="M16 17l3 3 5-6M16 28l3 3 5-6M29 18h5M29 29h5" />
    </>
  ),
  courbe: (
    <>
      <rect x="6" y="8" width="36" height="28" />
      <path d="M12 30l8-9 6 5 10-12M17 42h14M24 36v6" />
    </>
  ),
};

function Picto({ icone, className = "h-9 w-9" }: { icone: Etape["icone"]; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="miter">
      {PICTOS[icone]}
    </svg>
  );
}

const DUREE = 7000;

export default function ChaineProjet({ etapes, roles, projetId }: Props) {
  const n = etapes.length;
  const racine = useRef<HTMLElement>(null);
  const bande = useRef<HTMLOListElement>(null);
  const [k, setK] = useState(0);
  const [role, setRole] = useState<string | null>(null);
  const [auto, setAuto] = useState(false);
  const [visible, setVisible] = useState(false);
  const dejaVu = useRef(false);
  const etape = etapes[k];

  // Lecture automatique : dès que la section est visible, sauf si l'utilisateur la coupe ou préfère moins de mouvement.
  useEffect(() => {
    const el = racine.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      setVisible(e.isIntersecting);
      if (e.isIntersecting && !dejaVu.current) {
        dejaVu.current = true;
        setAuto(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      }
    }, { threshold: 0.35 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!auto || !visible) return;
    const t = setTimeout(() => setK((v) => (v + 1) % n), DUREE);
    return () => clearTimeout(t);
  }, [auto, visible, k, n]);

  // Garde l'étape courante au centre de la bande (mobile), sans faire défiler la page.
  useEffect(() => {
    const ol = bande.current;
    const li = ol?.children[k] as HTMLElement | undefined;
    if (!ol || !li) return;
    ol.scrollTo({ left: li.offsetLeft - (ol.clientWidth - li.offsetWidth) / 2, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [k]);

  const aller = useCallback((i: number) => {
    setAuto(false);
    setK(Math.min(n - 1, Math.max(0, i)));
  }, [n]);

  const concerne = (e: Etape) => role === null || role in e.actions;
  const acteurs = roles.filter((r) => r.id in etape.actions);
  const ordre = role ? [...acteurs].sort((a, b) => Number(b.id === role) - Number(a.id === role)) : acteurs;
  const roleChoisi = roles.find((r) => r.id === role);
  const hors = role !== null && !concerne(etape);

  return (
    <section ref={racine} aria-labelledby="titre-chaine" className="ch bg-black py-8 text-white sm:py-12">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 sm:px-6">
        <div className="space-y-2">
          <h2 id="titre-chaine" className="text-xs font-bold uppercase tracking-[0.2em] text-orange">
            Du serveur nu à la production
          </h2>
          <p className="max-w-3xl text-2xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Dix étapes, et qui fait quoi à chacune
          </p>
          <p className="max-w-3xl text-sm text-white/70 sm:text-base">
            On part de machines dans une baie : ni système, ni réseau, ni cluster. Choisissez un rôle pour suivre ce qu&apos;il fait, étape après étape.
          </p>
        </div>

        <div role="group" aria-label="Filtrer par rôle" className="flex flex-wrap gap-1.5">
          <button type="button" aria-pressed={role === null} onClick={() => setRole(null)} className="ch-role border-white px-2.5 py-1 text-xs font-bold">
            Tous les rôles
          </button>
          {roles.map((r) => (
            <button
              key={r.id}
              type="button"
              aria-pressed={role === r.id}
              onClick={() => setRole(role === r.id ? null : r.id)}
              className="ch-role flex items-center gap-1.5 border px-2.5 py-1 text-xs font-bold"
              style={{ borderColor: COULEURS[r.id] ?? "#fff" }}
            >
              <span className="h-2.5 w-2.5" style={{ background: COULEURS[r.id] ?? "#fff" }} aria-hidden />
              {court(r.libelle)}
            </button>
          ))}
        </div>

        <ol ref={bande} aria-label="Étapes du projet" className="ch-bande -mx-4 flex overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
          {etapes.map((e, i) => {
            const actif = i === k;
            const passe = i < k;
            return (
              <li key={e.id} className="relative flex min-w-[104px] flex-1 justify-center">
                <button
                  type="button"
                  onClick={() => aller(i)}
                  aria-current={actif ? "step" : undefined}
                  title={`Étape ${i + 1} sur ${n} : ${e.titre}`}
                  className="ch-etape group flex w-full flex-col items-center gap-2 px-1 text-center"
                  data-dim={!concerne(e)}
                >
                  <span className="ch-icone relative flex h-16 w-16 items-center justify-center border-2" data-actif={actif} data-passe={passe}>
                    <Picto icone={e.icone} />
                    <span className="absolute -left-2 -top-2 flex h-5 min-w-5 items-center justify-center bg-black px-1 text-[11px] font-bold ring-1 ring-white/60" aria-hidden>
                      {i + 1}
                    </span>
                  </span>
                  <span className={`text-xs leading-tight sm:text-sm ${actif ? "font-bold text-orange" : "text-white/85"}`}>{e.court}</span>
                  {role && concerne(e) && <span className="h-1 w-6" style={{ background: COULEURS[role] ?? "#fff" }} aria-hidden />}
                </button>
                {i < n - 1 && (
                  <svg viewBox="0 0 12 20" aria-hidden className="ch-fleche absolute right-0 top-[22px] h-5 w-3 translate-x-1/2" data-passe={i < k} data-cur={i === k - 1 || (i === k && auto)}>
                    <polygon points="0,0 12,10 0,20" />
                  </svg>
                )}
              </li>
            );
          })}
        </ol>

        <div className="ch-barre h-0.5 bg-white/15" aria-hidden>
          <div key={`${k}-${auto && visible}`} className="ch-progres h-full bg-orange" data-lecture={auto && visible} style={{ animationDuration: `${DUREE}ms` }} />
        </div>

        <div key={etape.id} className="ch-monte grid gap-6 lg:grid-cols-[1fr_1.4fr] lg:gap-10" aria-live="polite">
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
              Étape {k + 1} sur {n}
            </p>
            <h3 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-4xl">{etape.titre}</h3>
            <ul className="flex flex-wrap gap-1.5" aria-label="Outils et notions">
              {etape.outils.map((o) => (
                <li key={o} className="border border-white/40 px-2 py-1 text-xs text-white/85">
                  {o}
                </li>
              ))}
            </ul>
            <div className="border border-white/25 p-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-orange">Ce qui existe à la sortie</p>
              <p className="mt-1 font-bold">{etape.sortie}</p>
            </div>
          </div>

          <div className="space-y-2">
            {hors && roleChoisi && (
              <p className="border-l-4 border-white/40 pl-3 text-sm text-white/75">
                {court(roleChoisi.libelle)} n&apos;intervient pas à cette étape. Voici qui agit :
              </p>
            )}
            <ul className="space-y-2">
              {ordre.map((r, i) => {
                const couleur = COULEURS[r.id] ?? "#fff";
                const choisi = r.id === role;
                return (
                  <li
                    key={r.id}
                    className="ch-ligne border-l-4 py-1.5 pl-3"
                    data-choisi={choisi}
                    style={{ borderColor: couleur, animationDelay: `${i * 70}ms` }}
                  >
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: couleur }}>
                      {court(r.libelle)}
                    </p>
                    <p className={`text-sm sm:text-base ${role === null || choisi ? "text-white" : "text-white/60"}`}>{etape.actions[r.id]}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/20 pt-4">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => aller(k - 1)} disabled={k === 0} className="ch-ctrl" aria-label="Étape précédente">
              ←
            </button>
            <button
              type="button"
              onClick={() => setAuto((a) => !a)}
              aria-pressed={auto}
              className="ch-ctrl !w-auto px-3"
              aria-label={auto ? "Mettre la lecture en pause" : "Lancer la lecture"}
            >
              {auto ? "❚❚ Pause" : "▶ Lecture"}
            </button>
            <button type="button" onClick={() => aller(k + 1)} disabled={k === n - 1} className="ch-ctrl" aria-label="Étape suivante">
              →
            </button>
          </div>
          <Link href={urlProjet(projetId)} className="bouton !border-orange !bg-orange !px-5 !py-2.5 !text-black hover:!bg-white">
            Lire le projet de bout en bout →
          </Link>
        </div>
      </div>
    </section>
  );
}
