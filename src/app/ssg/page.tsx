import type { Metadata } from "next";
import { container } from "@/infrastructure/container";
import { MovieCard } from "@/presentation/components/MovieCard";
import { RenderInfo } from "@/presentation/components/RenderInfo";

/**
 * SSG — Static Site Generation.
 * `force-static` obliga a Next.js a producir este HTML una sola vez en el build.
 * Si algo intentara leer datos de la solicitud (cookies, headers) recibiría valores vacíos.
 */
export const dynamic = "force-static";

export const metadata: Metadata = { title: "SSG · Catálogo" };

export default async function SsgPage() {
  const { catalog, clock } = container();
  const movies = await catalog.listAll();
  const builtAt = clock.now().toISOString();

  return (
    <div className="space-y-8">
      <RenderInfo pattern="ssg" renderedAt={builtAt} renderedLabel="Generado en el build" />

      <section aria-labelledby="catalogo" className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 id="catalogo" className="text-xl font-bold text-white">
            Catálogo completo <span className="text-zinc-500">({movies.length})</span>
          </h2>
          <p className="text-xs text-zinc-500">Cada ficha usa ISR →</p>
        </div>
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {movies.map((movie) => (
            <li key={movie.slug}>
              <MovieCard movie={movie} href={`/isr/${movie.slug}`} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
