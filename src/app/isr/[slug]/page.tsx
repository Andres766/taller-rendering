import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { slugParamSchema } from "@/application/validation/schemas";
import { container } from "@/infrastructure/container";
import { fmt } from "@/presentation/format";
import { MoviePoster } from "@/presentation/components/MoviePoster";
import { RenderInfo } from "@/presentation/components/RenderInfo";
import { Stars } from "@/presentation/components/Stars";

export const revalidate = 30;

/**
 * La cartelera real cambia con el tiempo: una película que se estrena después
 * del build también debe tener ficha, así que se permiten rutas nuevas
 * (se generan en la primera visita y quedan en caché ISR).
 * Para evitar que un atacante llene la caché pidiendo IDs inventados, solo se
 * renderizan slugs que pertenecen a la cartelera actual; el resto es 404.
 */
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await container().catalog.listSlugs();
  return slugs.map((slug) => ({ slug }));
}

async function loadMovie(rawSlug: string) {
  const parsed = slugParamSchema.safeParse(rawSlug);
  if (!parsed.success) notFound();
  const { catalog } = container();
  const inCatalog = (await catalog.listSlugs()).includes(parsed.data);
  if (!inCatalog) notFound();
  return catalog.getBySlug(parsed.data);
}

export async function generateMetadata({ params }: PageProps<"/isr/[slug]">): Promise<Metadata> {
  const movie = await loadMovie((await params).slug);
  return { title: movie.title, description: movie.synopsis.slice(0, 160) };
}

export default async function IsrMoviePage({ params }: PageProps<"/isr/[slug]">) {
  const { slug } = await params;
  const movie = await loadMovie(slug);
  const { catalog, clock } = container();
  const trending = await catalog.getTrendingPosition(movie.slug);
  const generatedAt = clock.now().toISOString();

  return (
    <div className="space-y-8">
      <RenderInfo pattern="isr" renderedAt={generatedAt} renderedLabel="Ficha regenerada" />

      <article className="grid gap-8 md:grid-cols-[280px_1fr]">
        <MoviePoster movie={movie} size="lg" />
        <div className="space-y-4">
          <h2 className="text-3xl font-black text-white">{movie.title}</h2>
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-300">
            <Stars value={movie.stars} score={movie.criticRating} />
            <span>·</span>
            <span>{movie.duration}</span>
            <span>·</span>
            <span>{movie.genres.map(fmt.genre).join(", ")}</span>
          </div>
          <p className="leading-relaxed text-zinc-300">{movie.synopsis}</p>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-white/5 p-3">
              <dt className="text-zinc-400">Dirección</dt>
              <dd className="font-semibold text-white">{movie.director}</dd>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <dt className="text-zinc-400">Estreno</dt>
              <dd className="font-semibold text-white">{fmt.date(movie.releaseDate + "T12:00:00Z")}</dd>
            </div>
            <div className="col-span-2 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3">
              <dt className="text-amber-200">Popularidad en la cartelera</dt>
              <dd className="text-2xl font-black text-amber-300">
                #{trending.position} <span className="text-base font-semibold text-amber-200/80">de {trending.of}</span>
                <span className="ml-3 text-base font-semibold text-amber-200/80">índice {trending.score}/100</span>
              </dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/ssr" className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400">
              Ver funciones de hoy (SSR)
            </Link>
            <Link href={`/streaming?pelicula=${movie.slug}`} className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-400">
              Reseñas (Streaming)
            </Link>
            <Link href="/isr" className="rounded-lg border border-white/15 px-4 py-2 text-sm text-zinc-200 hover:bg-white/5">
              ← Tendencias
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
