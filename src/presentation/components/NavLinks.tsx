"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { RenderingPatternInfo } from "../catalog/RenderingPatterns";

/** Isla de cliente mínima: solo necesita el pathname para resaltar la sección activa. */
export function NavLinks({ patterns }: { patterns: Pick<RenderingPatternInfo, "key" | "acronym" | "route">[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Patrones de rendering" className="-mx-1 flex gap-1 overflow-x-auto pb-1 sm:pb-0">
      {patterns.map((p) => {
        const active = pathname === p.route || pathname.startsWith(`${p.route}/`);
        return (
          <Link
            key={p.key}
            href={p.route}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              active ? "bg-white text-zinc-950" : "text-zinc-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            {p.acronym}
          </Link>
        );
      })}
    </nav>
  );
}
