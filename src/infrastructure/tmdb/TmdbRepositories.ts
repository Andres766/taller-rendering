import { Movie } from "@/domain/entities/Movie";
import { Review } from "@/domain/entities/Review";
import type { MovieRepository, ReviewRepository } from "@/domain/repositories";
import type { Slug } from "@/domain/value-objects/Slug";
import { mapWithConcurrency } from "../util/concurrency";
import { TmdbError, type TmdbClient } from "./TmdbClient";
import { TmdbMapper } from "./TmdbMapper";
import { movieDetailsSchema, nowPlayingSchema, reviewsSchema } from "./schemas";

export interface TmdbCatalogOptions {
  region: string; // ISO 3166-1, p. ej. "CO"
  language: string; // p. ej. "es-CO"
  maxMovies?: number;
  concurrency?: number;
}

/**
 * Adaptador de MovieRepository sobre TMDB: la cartelera real ("now playing")
 * de la región configurada. Implementa la misma interfaz que el repositorio en
 * memoria, así que servicios y páginas no cambian (Liskov + DIP).
 */
export class TmdbMovieRepository implements MovieRepository {
  private readonly mapper: TmdbMapper;

  constructor(
    private readonly client: TmdbClient,
    private readonly options: TmdbCatalogOptions,
  ) {
    this.mapper = new TmdbMapper(options.region);
  }

  async findAll(): Promise<Movie[]> {
    const list = await this.client.get(
      "/movie/now_playing",
      { language: this.options.language, region: this.options.region, page: "1" },
      nowPlayingSchema,
    );

    const ids = [...new Set(list.results.map((m) => m.id))].slice(0, this.options.maxMovies ?? 20);
    // Detalles (duración, director, clasificación) con concurrencia limitada para respetar el rate limit de TMDB.
    // Una película retirada (404) se omite; cualquier otro error se propaga para que ISR conserve la versión anterior.
    const movies = await mapWithConcurrency(ids, this.options.concurrency ?? 4, (id) =>
      this.fetchMovie(id).catch((error: unknown) => {
        if (error instanceof TmdbError && error.status === 404) return null;
        throw error;
      }),
    );
    return movies.filter((m): m is Movie => m !== null);
  }

  async findBySlug(slug: Slug): Promise<Movie | null> {
    const id = TmdbMapper.idFromSlug(slug.toString());
    if (id === null) return null;
    try {
      const movie = await this.fetchMovie(id);
      // Solo se acepta el slug canónico: "123-otro-titulo" no debe resolver a la película 123.
      return movie && movie.slug.equals(slug) ? movie : null;
    } catch (error) {
      if (error instanceof TmdbError && error.status === 404) return null;
      throw error;
    }
  }

  private async fetchMovie(id: number): Promise<Movie | null> {
    const details = await this.client.get(
      `/movie/${id}`,
      { language: this.options.language, append_to_response: "credits,release_dates" },
      movieDetailsSchema,
    );
    const props = this.mapper.toMovieProps(details);
    if (!props) return null;
    try {
      return Movie.create(props);
    } catch (error) {
      console.warn(`[tmdb] película ${id} descartada: ${(error as Error).message}`);
      return null;
    }
  }
}

/** Reseñas reales de TMDB (la mayoría están en inglés; se intenta primero en español). */
export class TmdbReviewRepository implements ReviewRepository {
  private readonly mapper: TmdbMapper;

  constructor(
    private readonly client: TmdbClient,
    private readonly options: { region: string; language: string; limit?: number },
  ) {
    this.mapper = new TmdbMapper(options.region);
  }

  async findByMovie(slug: Slug): Promise<Review[]> {
    const id = TmdbMapper.idFromSlug(slug.toString());
    if (id === null) return [];

    let data = await this.client.get(`/movie/${id}/reviews`, { language: this.options.language, page: "1" }, reviewsSchema);
    if (data.results.length === 0) {
      data = await this.client.get(`/movie/${id}/reviews`, { language: "en-US", page: "1" }, reviewsSchema);
    }

    return this.mapper.toReviewProps(slug.toString(), data, this.options.limit ?? 5).flatMap((props) => {
      try {
        return [Review.create(props)];
      } catch {
        return [];
      }
    });
  }
}
