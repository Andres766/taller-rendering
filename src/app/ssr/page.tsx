import type { Metadata } from "next";
import type { ShowtimeDTO } from "@/application/dto";
import { CITIES, citySchema } from "@/application/validation/schemas";
import type { ShowtimeStatus } from "@/domain/entities/Showtime";
import { container } from "@/infrastructure/container";
import { fmt } from "@/presentation/format";
import { MoviePoster } from "@/presentation/components/MoviePoster";
import { RenderInfo } from "@/presentation/components/RenderInfo";

/**
 * SSR — Server-Side Rendering.
 * `force-dynamic` hace que el servidor ejecute este componente en cada solicitud:
 * la disponibilidad de sillas debe ser la real en el momento de la visita.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "SSR · Funciones de hoy" };

export default async function SsrPage({ searchParams }: PageProps<"/ssr">) {
  const rawCity = (await searchParams).ciudad;
  // Lista blanca: cualquier valor fuera de CITIES cae a "Pasto".
  const city = citySchema.parse(Array.isArray(rawCity) ? rawCity[0] : rawCity);

  const { showtimes, clock } = container();
  const billboard = await showtimes.getBillboard(city);
  const renderedAt = clock.now().toISOString();

  return (
    <div className="space-y-8">
      <RenderInfo pattern="ssr" renderedAt={renderedAt} renderedLabel="Renderizado en esta solicitud" />

      {/* Formulario GET: funciona sin JavaScript (mejora progresiva). */}
      <form method="get" className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-400">Ciudad</span>
          <select
            name="ciudad"
            defaultValue={city}
            className="rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-white"
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400">
          Consultar funciones
        </button>
        <p className="text-xs text-zinc-500">La ocupación se recalcula en el servidor en cada consulta.</p>
      </form>

      <section aria-labelledby="cartelera" className="space-y-4">
        <h2 id="cartelera" className="text-xl font-bold text-white">
          Cartelera de hoy en {city}
        </h2>
        {billboard.length === 0 ? (
          <p className="text-zinc-400">No hay funciones programadas.</p>
        ) : (
          <ul className="space-y-4">
            {billboard.map(({ movie, showtimes: list }) => (
              <li key={movie.slug} className="grid grid-cols-[80px_1fr] gap-4 rounded-2xl border border-white/5 bg-zinc-900/60 p-4 sm:grid-cols-[120px_1fr]">
                <MoviePoster movie={movie} size="sm" />
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-white">{movie.title}</h3>
                  <p className="text-xs text-zinc-400">
                    {movie.duration} · {movie.ageRating}
                  </p>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((s) => (
                      <ShowtimeChip key={s.id} showtime={s} />
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const STATUS_STYLES: Record<ShowtimeStatus, { label: string; className: string }> = {
  disponible: { label: "Disponible", className: "text-emerald-300" },
  "ultimas-sillas": { label: "Últimas sillas", className: "text-amber-300" },
  agotada: { label: "Agotada", className: "text-rose-300" },
  finalizada: { label: "Ya inició", className: "text-zinc-500" },
};

function ShowtimeChip({ showtime }: { showtime: ShowtimeDTO }) {
  const status = STATUS_STYLES[showtime.status];
  return (
    <li className={`rounded-xl border border-white/10 bg-black/30 p-3 text-sm ${showtime.status === "finalizada" ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="font-mono font-bold text-white">{fmt.showtime(showtime.startsAt)}</span>
        <span className="rounded bg-white/10 px-1.5 text-[10px] font-bold text-zinc-200">{showtime.format}</span>
      </div>
      <p className="mt-1 truncate text-xs text-zinc-400">
        {showtime.cinema} · {showtime.room}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden>
        <div className="h-full bg-sky-400" style={{ width: `${showtime.occupancyPercent}%` }} />
      </div>
      <p className="mt-1 flex justify-between text-xs">
        <span className={status.className}>{status.label}</span>
        <span className="text-zinc-300">
          {showtime.availableSeats}/{showtime.totalSeats} sillas
        </span>
      </p>
    </li>
  );
}
