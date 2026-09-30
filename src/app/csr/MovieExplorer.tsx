"use client";

import { useState } from "react";
import { fmt } from "@/presentation/format";
import { MovieCard } from "@/presentation/components/MovieCard";
import { useFavorites } from "@/presentation/hooks/useFavorites";
import { useMovieSearch } from "@/presentation/hooks/useMovieSearch";

interface Option {
  value?: string;
  key?: string;
  label: string;
}

export function MovieExplorer({ sortOptions, genres }: { sortOptions: { key: string; label: string }[]; genres: Option[] }) {
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState("");
  const [sort, setSort] = useState(sortOptions[0]?.key ?? "rating");
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const search = useMovieSearch({ q, genre, sort });
  const { favorites, isFavorite, toggle } = useFavorites();

  const items = (search.data?.items ?? []).filter((m) => !onlyFavorites || favorites.includes(m.slug));

  return (
    <section aria-labelledby="buscador" className="space-y-5">
      <h2 id="buscador" className="text-xl font-bold text-white">
        Buscador de películas
      </h2>

      <div className="grid gap-3 rounded-2xl border border-white/10 bg-zinc-900/60 p-4 md:grid-cols-[1fr_auto_auto_auto]">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-400">Título o director</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            maxLength={60}
            placeholder="Ej.: órbita, Lucía…"
            className="rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-white placeholder:text-zinc-600"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-400">Género</span>
          <select value={genre} onChange={(e) => setGenre(e.target.value)} className="rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-white">
            <option value="">Todos</option>
            {genres.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-400">Ordenar por</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-white">
            {sortOptions.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-zinc-300">
          <input type="checkbox" checked={onlyFavorites} onChange={(e) => setOnlyFavorites(e.target.checked)} className="h-4 w-4 accent-violet-500" />
          Solo favoritos ({favorites.length})
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm" aria-live="polite">
        <span className="text-zinc-400">
          {search.status === "loading" && "Buscando en el navegador…"}
          {search.status === "success" && `${items.length} resultado(s)`}
          {search.status === "error" && <span className="text-rose-300">{search.error}</span>}
        </span>
        {search.fetchedAt && (
          <span className="text-xs text-zinc-500">
            Renderizado en tu navegador a las <span className="font-mono text-violet-300">{fmt.clock(new Date(search.fetchedAt))}</span>
          </span>
        )}
      </div>

      {search.data === null && search.status === "loading" ? (
        <SkeletonGrid />
      ) : (
        <ul className={`grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 ${search.status === "loading" ? "opacity-60" : ""}`}>
          {items.map((movie) => (
            <li key={movie.slug}>
              <MovieCard
                movie={movie}
                footer={
                  <button
                    type="button"
                    onClick={() => toggle(movie.slug)}
                    aria-pressed={isFavorite(movie.slug)}
                    className={`w-full rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                      isFavorite(movie.slug) ? "bg-violet-500 text-white" : "border border-white/15 text-zinc-200 hover:bg-white/5"
                    }`}
                  >
                    {isFavorite(movie.slug) ? "★ En favoritos" : "☆ Agregar a favoritos"}
                  </button>
                }
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SkeletonGrid() {
  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: 8 }, (_, i) => (
        <li key={i} className="h-80 animate-pulse rounded-2xl bg-zinc-900" />
      ))}
    </ul>
  );
}
