import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { container } from "@/infrastructure/container";
import { fmt } from "@/presentation/format";
import { MoviePoster } from "@/presentation/components/MoviePoster";
import { RenderInfo } from "@/presentation/components/RenderInfo";
import { Stars } from "@/presentation/components/Stars";

/**
 * Streaming SSR.
 * El encabezado sale de inmediato; cada <Suspense> envía su HTML cuando sus
 * datos están listos (1 s, 2,2 s y 3,5 s), sin bloquear a las demás secciones.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Streaming · Estreno destacado" };

export default async function StreamingPage({ searchParams }: PageProps<"/streaming">) {
  const { catalog, clock } = container();
  const trending = await catalog.getTrending(4);
  const requested = (await searchParams).pelicula;
  // Solo se aceptan slugs presentes en el ranking (lista blanca).
  const movie = trending.find((m) => m.slug === requested) ?? trending[0];
  const shellAt = clock.now().toISOString();

  return (
    <div className="space-y-8">
      <RenderInfo pattern="streaming" renderedAt={shellAt} renderedLabel="Cascarón enviado" />

      <nav aria-label="Elegir película" className="flex flex-wrap gap-2">
        {trending.map((m) => (
          <Link
            key={m.slug}
            href={`/streaming?pelicula=${m.slug}`}
            aria-current={m.slug === movie.slug ? "page" : undefined}
            className={`rounded-full px-3 py-1 text-sm ${m.slug === movie.slug ? "bg-rose-500 text-white" : "border border-white/15 text-zinc-300 hover:bg-white/5"}`}
          >
            {m.title}
          </Link>
        ))}
      </nav>

      <article className="grid gap-6 md:grid-cols-[220px_1fr]">
        <MoviePoster movie={movie} size="lg" />
        <div className="space-y-3">
          <h2 className="text-3xl font-black text-white">{movie.title}</h2>
          <Stars value={movie.stars} score={movie.criticRating} />
          <p className="text-zinc-300">{movie.synopsis}</p>
          <StreamStamp label="Encabezado" at={shellAt} />
        </div>
      </article>

      <div className="grid gap-6 lg:grid-cols-3">
        <Suspense fallback={<SectionSkeleton title="Funciones hoy" eta="≈1 s" />}>
          <ShowtimesSection slug={movie.slug} />
        </Suspense>
        <Suspense fallback={<SectionSkeleton title="Reseñas del público" eta="≈2,2 s" />}>
          <ReviewsSection slug={movie.slug} />
        </Suspense>
        <Suspense fallback={<SectionSkeleton title="También te puede gustar" eta="≈3,5 s" />}>
          <RecommendationsSection slug={movie.slug} />
        </Suspense>
      </div>
    </div>
  );
}

async function ShowtimesSection({ slug }: { slug: string }) {
  const { streaming, clock } = container();
  const list = (await streaming.showtimes.getForMovie(slug)).filter((s) => s.status !== "finalizada").slice(0, 6);
  return (
    <Section title="Funciones hoy" at={clock.now().toISOString()}>
      {list.length === 0 ? (
        <p className="text-sm text-zinc-400">No quedan funciones hoy.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {list.map((s) => (
            <li key={s.id} className="flex justify-between rounded-lg bg-black/30 px-3 py-2">
              <span>
                <span className="font-mono font-bold text-white">{fmt.showtime(s.startsAt)}</span>{" "}
                <span className="text-zinc-400">
                  {s.cinema} ({s.city})
                </span>
              </span>
              <span className="text-zinc-300">{s.availableSeats} sillas</span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

async function ReviewsSection({ slug }: { slug: string }) {
  const { streaming, clock } = container();
  const summary = await streaming.reviews.getSummary(slug);
  return (
    <Section title={`Reseñas del público (${summary.count})`} at={clock.now().toISOString()}>
      {summary.average !== null && <p className="mb-3 text-sm text-zinc-300">Promedio: {summary.average.toFixed(1)}/10</p>}
      {summary.count === 0 && <p className="text-sm text-zinc-400">Aún no hay reseñas publicadas para esta película en la fuente de datos. Prueba con otra.</p>}
      <ul className="space-y-3">
        {summary.reviews.map((r) => (
          <li key={r.id} className="rounded-lg bg-black/30 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">{r.author}</span>
              <Stars value={r.stars} />
            </div>
            {/* React escapa el texto automáticamente: el comentario no puede inyectar HTML (XSS). */}
            <p className="mt-1 line-clamp-6 text-zinc-300">{r.comment}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

async function RecommendationsSection({ slug }: { slug: string }) {
  const { streaming, clock } = container();
  const recs = await streaming.catalog.getRecommendations(slug);
  return (
    <Section title="También te puede gustar" at={clock.now().toISOString()}>
      <ul className="space-y-3">
        {recs.map((m) => (
          <li key={m.slug}>
            <Link href={`/streaming?pelicula=${m.slug}`} className="flex items-center gap-3 rounded-lg bg-black/30 p-2 hover:bg-black/50">
              <div className="w-14 shrink-0">
                <MoviePoster movie={m} size="sm" />
              </div>
              <div className="text-sm">
                <p className="font-semibold text-white">{m.title}</p>
                <Stars value={m.stars} score={m.criticRating} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Section({ title, at, children }: { title: string; at: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-rose-400/20 bg-zinc-900/60 p-4">
      <h3 className="mb-3 font-bold text-white">{title}</h3>
      {children}
      <div className="mt-4">
        <StreamStamp label="Llegó" at={at} />
      </div>
    </section>
  );
}

function StreamStamp({ label, at }: { label: string; at: string }) {
  return (
    <p className="text-xs text-zinc-500">
      {label} a las <span className="font-mono text-rose-300">{fmt.clock(at)}</span>
    </p>
  );
}

function SectionSkeleton({ title, eta }: { title: string; eta: string }) {
  return (
    <section className="rounded-2xl border border-dashed border-rose-400/30 bg-zinc-900/30 p-4" aria-busy="true">
      <h3 className="mb-3 font-bold text-zinc-400">{title}</h3>
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-white/5" />
        ))}
      </div>
      <p className="mt-4 text-xs text-rose-300/80">Transmitiendo… ({eta})</p>
    </section>
  );
}
