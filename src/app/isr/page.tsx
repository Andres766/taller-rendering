import type { Metadata } from "next";
import Link from "next/link";
import { container } from "@/infrastructure/container";
import { MoviePoster } from "@/presentation/components/MoviePoster";
import { RenderInfo } from "@/presentation/components/RenderInfo";

/**
 * ISR — Incremental Static Regeneration.
 * La página se prerenderiza en el build y Next.js la regenera en segundo plano
 * como máximo una vez cada 30 segundos (stale-while-revalidate).
 */
export const revalidate = 30;

export const metadata: Metadata = { title: "ISR · Tendencias" };

export default async function IsrTrendingPage() {
  const { catalog, clock } = container();
  const trending = await catalog.getTrending(8);
  const generatedAt = clock.now().toISOString();

  return (
    <div className="space-y-8">
      <RenderInfo pattern="isr" renderedAt={generatedAt} renderedLabel="Última regeneración">
        <RevalidateHint />
      </RenderInfo>

      <section aria-labelledby="tendencias" className="space-y-4">
        <h2 id="tendencias" className="text-xl font-bold text-white">
          Más populares en cartelera
        </h2>
        <ol className="grid gap-3 md:grid-cols-2">
          {trending.map((movie) => (
            <li key={movie.slug}>
              <Link
                href={`/isr/${movie.slug}`}
                className="flex items-center gap-4 rounded-2xl border border-white/5 bg-zinc-900/60 p-3 transition hover:border-amber-400/30"
              >
                <span className="w-8 text-center text-2xl font-black text-amber-300">{movie.position}</span>
                <div className="w-20 shrink-0">
                  <MoviePoster movie={movie} size="sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">{movie.title}</p>
                  <p className="text-xs text-zinc-400">{movie.director}</p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10" aria-hidden>
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${movie.trendingScore}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">Popularidad: {movie.trendingScore}/100</p>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function RevalidateHint() {
  return (
    <details className="rounded-xl bg-black/30 p-3 text-sm text-zinc-300">
      <summary className="cursor-pointer font-semibold text-amber-300">Revalidación bajo demanda (webhook)</summary>
      <p className="mt-2">
        Además del intervalo, un CMS puede forzar la regeneración con un secreto (comparado en tiempo constante y con
        rate limit):
      </p>
      <pre className="mt-2 overflow-x-auto rounded-lg bg-black/60 p-3 font-mono text-xs text-zinc-200">
        {`curl -X POST https://<tu-dominio>/api/revalidate \\
  -H "Authorization: Bearer $REVALIDATE_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{"slug":"<slug-de-la-pelicula>"}'`}
      </pre>
    </details>
  );
}
