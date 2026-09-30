import type { Clock, MovieRepository, ShowtimeRepository } from "@/domain/repositories";
import { Slug } from "@/domain/value-objects/Slug";
import type { MovieBillboardDTO, ShowtimeDTO } from "../dto";
import { MovieMapper, ShowtimeMapper } from "../mappers";
import type { City } from "../validation/schemas";

/** Casos de uso de la cartelera: funciones del día y disponibilidad de sillas. */
export class ShowtimeService {
  constructor(
    private readonly showtimes: ShowtimeRepository,
    private readonly movies: MovieRepository,
    private readonly clock: Clock,
  ) {}

  /** Cartelera de hoy para una ciudad, agrupada por película. */
  async getBillboard(city: City): Promise<MovieBillboardDTO[]> {
    const now = this.clock.now();
    const [showtimes, movies] = await Promise.all([
      this.showtimes.findByCity(city, now),
      this.movies.findAll(),
    ]);

    const byMovie = new Map<string, ShowtimeDTO[]>();
    for (const s of showtimes) {
      const key = s.movieSlug.toString();
      const list = byMovie.get(key) ?? [];
      list.push(ShowtimeMapper.toDTO(s, now));
      byMovie.set(key, list);
    }

    return movies
      .filter((m) => byMovie.has(m.slug.toString()))
      .map((m) => ({
        movie: MovieMapper.toDTO(m, now),
        showtimes: byMovie
          .get(m.slug.toString())!
          .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
      }));
  }

  async getForMovie(rawSlug: string): Promise<ShowtimeDTO[]> {
    const now = this.clock.now();
    const list = await this.showtimes.findByMovie(Slug.create(rawSlug), now);
    return list
      .map((s) => ShowtimeMapper.toDTO(s, now))
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }
}
