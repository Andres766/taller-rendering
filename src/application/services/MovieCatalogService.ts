import { NotFoundError } from "@/domain/errors";
import type { Clock, MovieRepository } from "@/domain/repositories";
import type { TrendingCalculator } from "@/domain/services/TrendingCalculator";
import { Slug } from "@/domain/value-objects/Slug";
import type { MovieDTO, SearchResultDTO, TrendingMovieDTO } from "../dto";
import { MovieMapper } from "../mappers";
import type { SortStrategyRegistry } from "../sorting/MovieSortStrategy";
import type { SearchQuery } from "../validation/schemas";

/**
 * Servicio de aplicación (casos de uso del catálogo).
 * Recibe sus dependencias por constructor (Inyección de Dependencias),
 * por eso puede probarse con repositorios y relojes falsos.
 */
export class MovieCatalogService {
  constructor(
    private readonly movies: MovieRepository,
    private readonly sorting: SortStrategyRegistry,
    private readonly trending: TrendingCalculator,
    private readonly clock: Clock,
  ) {}

  async listAll(): Promise<MovieDTO[]> {
    const now = this.clock.now();
    const all = await this.movies.findAll();
    const strategy = this.sorting.resolve("release");
    return [...all].sort((a, b) => strategy.compare(a, b)).map((m) => MovieMapper.toDTO(m, now));
  }

  async listSlugs(): Promise<string[]> {
    const all = await this.movies.findAll();
    return all.map((m) => m.slug.toString());
  }

  async getBySlug(rawSlug: string): Promise<MovieDTO> {
    const slug = Slug.create(rawSlug);
    const movie = await this.movies.findBySlug(slug);
    if (!movie) throw new NotFoundError("Película", slug.toString());
    return MovieMapper.toDTO(movie, this.clock.now());
  }

  async search(query: SearchQuery): Promise<SearchResultDTO> {
    const now = this.clock.now();
    const strategy = this.sorting.resolve(query.sort);
    const all = await this.movies.findAll();
    const items = all
      .filter((m) => m.matches(query.q))
      .filter((m) => (query.genre ? m.hasGenre(query.genre) : true))
      .sort((a, b) => strategy.compare(a, b))
      .map((m) => MovieMapper.toDTO(m, now));

    return {
      items,
      total: items.length,
      query: { q: query.q, genre: query.genre ?? null, sort: strategy.key },
    };
  }

  /** Ranking por popularidad (0–100 relativo a la más popular). */
  async getTrending(limit = 10): Promise<TrendingMovieDTO[]> {
    const now = this.clock.now();
    const all = await this.movies.findAll();
    return this.trending
      .rank(all)
      .slice(0, limit)
      .map(({ movie, score }, index) => ({
        ...MovieMapper.toDTO(movie, now),
        trendingScore: score,
        position: index + 1,
      }));
  }

  /** Puntaje y posición de una película dentro del ranking actual. */
  async getTrendingPosition(rawSlug: string): Promise<{ score: number; position: number; of: number }> {
    const slug = Slug.create(rawSlug);
    const ranking = this.trending.rank(await this.movies.findAll());
    const index = ranking.findIndex((e) => e.movie.slug.equals(slug));
    if (index === -1) throw new NotFoundError("Película", slug.toString());
    return { score: ranking[index].score, position: index + 1, of: ranking.length };
  }

  /** Recomendaciones: películas que comparten al menos un género. */
  async getRecommendations(rawSlug: string, limit = 3): Promise<MovieDTO[]> {
    const slug = Slug.create(rawSlug);
    const now = this.clock.now();
    const all = await this.movies.findAll();
    const target = all.find((m) => m.slug.equals(slug));
    if (!target) throw new NotFoundError("Película", slug.toString());
    const byRating = this.sorting.resolve("rating");
    return all
      .filter((m) => !m.equals(target) && m.genres.some((g) => target.hasGenre(g)))
      .sort((a, b) => byRating.compare(a, b))
      .slice(0, limit)
      .map((m) => MovieMapper.toDTO(m, now));
  }
}
