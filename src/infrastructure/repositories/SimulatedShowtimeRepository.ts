import type { Movie } from "@/domain/entities/Movie";
import { Showtime } from "@/domain/entities/Showtime";
import type { MovieRepository, ShowtimeRepository } from "@/domain/repositories";
import type { Slug } from "@/domain/value-objects/Slug";
import { pseudoRandom } from "../util/pseudoRandom";

const COLOMBIA_UTC_OFFSET_HOURS = 5; // Colombia no usa horario de verano
const SLOTS: readonly [number, number][] = [
  [13, 40],
  [16, 10],
  [18, 50],
  [21, 20],
];
const FORMATS = ["2D", "3D", "IMAX"] as const;

/**
 * Simula el sistema de taquilla de los cines. No existe una API pública con
 * las funciones y sillas de los cines colombianos, así que se generan de forma
 * determinista sobre el catálogo real (o de demo) que entregue el
 * MovieRepository inyectado. La ocupación cambia cada 10 segundos para que el
 * SSR muestre datos distintos en cada solicitud, como con inventario real.
 */
export class SimulatedShowtimeRepository implements ShowtimeRepository {
  constructor(
    private readonly movies: MovieRepository,
    private readonly cinemasByCity: Readonly<Record<string, readonly string[]>>,
    private readonly volatilityWindowMs = 10_000,
  ) {}

  async findByCity(city: string, now: Date): Promise<Showtime[]> {
    const movies = await this.movies.findAll();
    const cinemas = this.cinemasByCity[city] ?? [];
    return cinemas.flatMap((cinema) => this.generateFor(movies, city, cinema, now));
  }

  async findByMovie(slug: Slug, now: Date): Promise<Showtime[]> {
    const movies = await this.movies.findAll();
    return Object.entries(this.cinemasByCity)
      .flatMap(([city, cinemas]) => cinemas.flatMap((cinema) => this.generateFor(movies, city, cinema, now)))
      .filter((s) => s.movieSlug.equals(slug));
  }

  private generateFor(movies: readonly Movie[], city: string, cinema: string, now: Date): Showtime[] {
    const local = new Date(now.getTime() - COLOMBIA_UTC_OFFSET_HOURS * 3_600_000);
    const [y, m, d] = [local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()];
    const dayKey = `${y}-${m}-${d}`;
    const bucket = Math.floor(now.getTime() / this.volatilityWindowMs);

    // Las películas más populares (tercio superior) tienen todas las funciones del día.
    const popularThreshold = [...movies.map((m) => m.popularity)].sort((a, b) => b - a)[Math.floor(movies.length / 3)] ?? Infinity;

    return movies
      .filter((movie) => pseudoRandom(`${dayKey}:${cinema}:${movie.slug}`) > 0.35)
      .flatMap((movie, movieIndex) =>
        SLOTS.filter((_, i) => (i + movieIndex) % 2 === 0 || movie.popularity >= popularThreshold).map(([h, min], slotIndex) => {
          const slug = movie.slug.toString();
          const startsAt = new Date(Date.UTC(y, m, d, h + COLOMBIA_UTC_OFFSET_HOURS, min));
          const totalSeats = 80 + Math.floor(pseudoRandom(`${cinema}:${slotIndex}`) * 5) * 20;
          const hoursLeft = (startsAt.getTime() - now.getTime()) / 3_600_000;
          const demand = Math.min(1, Math.max(0, 1 - hoursLeft / 12)); // sube al acercarse la hora
          const noise = pseudoRandom(`${cinema}:${slug}:${slotIndex}:${bucket}`) * 0.2;
          const reservedSeats = Math.min(totalSeats, Math.floor(totalSeats * (0.2 + demand * 0.7 + noise)));

          return Showtime.create({
            id: `${cinema}-${slug}-${h}${min}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            movieSlug: slug,
            cinema,
            city,
            room: `Sala ${1 + ((movieIndex + slotIndex) % 8)}`,
            startsAt,
            format: FORMATS[Math.floor(pseudoRandom(`${slug}:${slotIndex}`) * FORMATS.length)],
            totalSeats,
            reservedSeats,
          });
        }),
      );
  }
}
