"use client";

import { useFavorites } from "@/presentation/hooks/useFavorites";

/** Isla: comparte el mismo store de favoritos que la página CSR. */
export function FavoriteIsland({ slug, title }: { slug: string; title: string }) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(slug);

  return (
    <button
      type="button"
      onClick={() => toggle(slug)}
      aria-pressed={active}
      aria-label={active ? `Quitar ${title} de favoritos` : `Agregar ${title} a favoritos`}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ring-2 ring-teal-400/60 transition ${
        active ? "bg-teal-400 text-zinc-950" : "bg-black/30 text-teal-300 hover:bg-teal-400/20"
      }`}
    >
      {active ? "♥" : "♡"}
    </button>
  );
}
