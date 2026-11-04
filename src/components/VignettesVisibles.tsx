"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Enveloppe des vignettes animées : le mouvement ne tourne que lorsqu'elles sont à l'écran (data-anim="on").
 * Hors écran, ou sans JavaScript, elles restent dans leur état final.
 */
export default function VignettesVisibles({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(([entree]) => setVisible(entree.isIntersecting), { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} data-anim={visible ? "on" : "off"}>
      {children}
    </div>
  );
}
