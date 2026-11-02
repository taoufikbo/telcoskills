"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import { suivre, type Evenement } from "./analytics";

type Props = ComponentProps<typeof Link> & { evenement: Evenement; donnees?: Record<string, string | number | boolean>; externe?: boolean };

/** Lien qui enregistre un événement de mesure au clic, avec la page d'où il part. */
export default function LienSuivi({ evenement, donnees, externe, href, onClick, ...reste }: Props) {
  const source = usePathname();
  const clic: ComponentProps<typeof Link>["onClick"] = (e) => {
    suivre(evenement, { source, ...donnees });
    onClick?.(e);
  };
  if (externe) {
    const { children, className } = reste;
    return (
      <a href={String(href)} target="_blank" rel="noopener noreferrer" className={className} onClick={clic as never}>
        {children}
      </a>
    );
  }
  return <Link href={href} onClick={clic} {...reste} />;
}
