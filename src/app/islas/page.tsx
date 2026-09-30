import type { Metadata } from "next";
import { container } from "@/infrastructure/container";
import { fmt } from "@/presentation/format";
import { MoviePoster } from "@/presentation/components/MoviePoster";
import { RenderInfo } from "@/presentation/components/RenderInfo";
import { Stars } from "@/presentation/components/Stars";
import { FavoriteIsland } from "./FavoriteIsland";
import { TrailerIsland } from "./TrailerIsland";

/**
 * React Server Components + islas de cliente (hidratación parcial).
 * Todo este archivo se ejecuta solo en el servidor: su código NO se envía al
 * navegador. Únicamente FavoriteIsland y TrailerIsland ('use client') se hidratan.
 */
export const dynamic = "force-static";

export const metadata: Metadata = { title: "RSC + Islas" };

export default async function IslandsPage() {
  const { catalog, clock } = container();
  const movies = await catalog.listAll();
  const builtAt = clock.now().toISOString();

  return (
    <div className="space-y-8">
      <RenderInfo pattern="islas" renderedAt={builtAt} renderedLabel="HTML del servidor">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <Legend color="bg-zinc-500" title="Server Component">
            Póster, textos, estrellas y ficha técnica. No envían JavaScript.
          </Legend>
          <Legend color="bg-teal-400" title="Isla de cliente">
            Botón ♥ y “Ver tráiler”. Solo estas piezas se hidratan en el navegador.
          </Legend>
        </div>
      </RenderInfo>

      <ul className="grid gap-4 md:grid-cols-2">
        {movies.map((movie) => (
          <li key={movie.slug} className="grid grid-cols-[110px_1fr] gap-4 rounded-2xl border border-white/5 bg-zinc-900/60 p-4">
            <MoviePoster movie={movie} size="sm" />
            <div className="flex min-w-0 flex-col">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-bold text-white">{movie.title}</h2>
                <FavoriteIsland slug={movie.slug} title={movie.title} />
              </div>
              <Stars value={movie.stars} score={movie.criticRating} />
              <p className="mt-1 line-clamp-3 text-sm text-zinc-400">{movie.synopsis}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {movie.genres.map(fmt.genre).join(" · ")} · {movie.duration}
              </p>
              <div className="mt-auto pt-3">
                <TrailerIsland title={movie.title} palette={movie.palette} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Legend({ color, title, children }: { color: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl bg-black/30 p-3">
      <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${color}`} aria-hidden />
      <div>
        <p className="font-semibold text-white">{title}</p>
        <p className="text-zinc-400">{children}</p>
      </div>
    </div>
  );
}
