import "server-only";
import { MovieCatalogService } from "@/application/services/MovieCatalogService";
import { ReviewService } from "@/application/services/ReviewService";
import { ShowtimeService } from "@/application/services/ShowtimeService";
import { SortStrategyRegistry } from "@/application/sorting/MovieSortStrategy";
import type { Clock, MovieRepository, ReviewRepository } from "@/domain/repositories";
import { TrendingCalculator } from "@/domain/services/TrendingCalculator";
import { TtlCache } from "./cache/TtlCache";
import { type Env, getEnv } from "./config/env";
import { MOVIES_SEED } from "./data/movies.seed";
import { CINEMAS, REVIEWS_SEED } from "./data/reviews.seed";
import { CachingMovieRepository, CachingReviewRepository } from "./repositories/CachingDecorators";
import { InMemoryMovieRepository } from "./repositories/InMemoryMovieRepository";
import { InMemoryReviewRepository } from "./repositories/InMemoryReviewRepository";
import {
  LatencyMovieRepository,
  LatencyReviewRepository,
  LatencyShowtimeRepository,
} from "./repositories/LatencyDecorators";
import { SimulatedShowtimeRepository } from "./repositories/SimulatedShowtimeRepository";
import { type RateLimiter, TokenBucketRateLimiter } from "./security/RateLimiter";
import { SecretVerifier } from "./security/SecretVerifier";
import { ItunesClient } from "./itunes/ItunesClient";
import { ItunesMovieRepository, ItunesReviewRepository } from "./itunes/ItunesRepositories";
import { TmdbClient } from "./tmdb/TmdbClient";
import { TmdbMovieRepository, TmdbReviewRepository } from "./tmdb/TmdbRepositories";
import { SystemClock } from "./time/SystemClock";

export interface DataSourceInfo {
  kind: "tmdb" | "itunes" | "demo";
  label: string;
}

interface DataSource {
  info: DataSourceInfo;
  movies: MovieRepository;
  reviews: ReviewRepository;
}

/**
 * Fábrica de la fuente de datos (se elige una sola vez, aquí):
 * - TMDB: cartelera de cines (requiere TMDB_API_TOKEN).
 * - iTunes: Top de películas de la tienda del país (real y sin clave).
 * - demo: catálogo ficticio en memoria (sin red).
 * Las fuentes remotas se decoran con caché para cuidar su cuota.
 */
function createDataSource(env: Env, clock: Clock): DataSource {
  const kind = env.CATALOG_SOURCE === "auto" ? (env.TMDB_API_TOKEN ? "tmdb" : "itunes") : env.CATALOG_SOURCE;
  const region = env.CATALOG_REGION;
  const withCache = (movies: MovieRepository, reviews: ReviewRepository) => ({
    movies: new CachingMovieRepository(movies, new TtlCache(clock, 15 * 60_000)),
    reviews: new CachingReviewRepository(reviews, new TtlCache(clock, 60 * 60_000)),
  });

  switch (kind) {
    case "tmdb": {
      if (!env.TMDB_API_TOKEN) throw new Error("CATALOG_SOURCE=tmdb requiere TMDB_API_TOKEN");
      const client = new TmdbClient({ token: env.TMDB_API_TOKEN });
      const options = { region, language: env.CATALOG_LANGUAGE };
      return {
        info: { kind, label: `TMDB · En cartelera (${region})` },
        ...withCache(new TmdbMovieRepository(client, options), new TmdbReviewRepository(client, options)),
      };
    }
    case "itunes": {
      const client = new ItunesClient();
      const options = { country: region };
      return {
        info: { kind, label: `iTunes Store · Top películas (${region})` },
        ...withCache(new ItunesMovieRepository(client, options), new ItunesReviewRepository(client, options)),
      };
    }
    case "demo":
      return {
        info: { kind, label: "Datos de demostración" },
        movies: new InMemoryMovieRepository(MOVIES_SEED),
        reviews: new InMemoryReviewRepository(REVIEWS_SEED),
      };
  }
}

/**
 * Composition Root: el único lugar donde se eligen las implementaciones
 * concretas y se conectan las dependencias. Las páginas piden servicios al
 * contenedor; nunca instancian repositorios por su cuenta.
 */
export class Container {
  readonly clock: Clock = new SystemClock();

  private readonly env = getEnv();
  private readonly source = createDataSource(this.env, this.clock);
  private readonly showtimeRepository = new SimulatedShowtimeRepository(this.source.movies, CINEMAS);

  readonly dataSource: DataSourceInfo = this.source.info;

  readonly catalog = new MovieCatalogService(
    this.source.movies,
    new SortStrategyRegistry(),
    new TrendingCalculator(),
    this.clock,
  );

  readonly showtimes = new ShowtimeService(this.showtimeRepository, this.source.movies, this.clock);

  readonly reviews = new ReviewService(this.source.reviews);

  /**
   * Mismos servicios, pero con repositorios decorados con latencia distinta
   * (demo de streaming): cada sección de la página llega en un momento diferente.
   */
  readonly streaming = {
    showtimes: new ShowtimeService(
      new LatencyShowtimeRepository(this.showtimeRepository, 1000),
      this.source.movies,
      this.clock,
    ),
    reviews: new ReviewService(new LatencyReviewRepository(this.source.reviews, 2200)),
    catalog: new MovieCatalogService(
      new LatencyMovieRepository(this.source.movies, 3500),
      new SortStrategyRegistry(),
      new TrendingCalculator(),
      this.clock,
    ),
  } as const;

  readonly apiRateLimiter: RateLimiter = new TokenBucketRateLimiter(this.clock, 30, 1);
  readonly adminRateLimiter: RateLimiter = new TokenBucketRateLimiter(this.clock, 5, 0.05);

  readonly revalidationSecret = new SecretVerifier(this.env.REVALIDATE_SECRET);
}

// Singleton por proceso. Se guarda en globalThis para sobrevivir al hot-reload en desarrollo.
const globalForContainer = globalThis as unknown as { __cineContainer?: Container };

export function container(): Container {
  globalForContainer.__cineContainer ??= new Container();
  return globalForContainer.__cineContainer;
}
