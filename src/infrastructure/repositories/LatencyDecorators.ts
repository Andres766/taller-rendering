import type { Movie } from "@/domain/entities/Movie";
import type { Review } from "@/domain/entities/Review";
import type { Showtime } from "@/domain/entities/Showtime";
import type { MovieRepository, ReviewRepository, ShowtimeRepository } from "@/domain/repositories";
import type { Slug } from "@/domain/value-objects/Slug";

/**
 * Patrón Decorator: envuelve un repositorio y le agrega latencia artificial
 * sin modificarlo. Simula servicios externos lentos para la demo de
 * Streaming + Suspense. La clase base abstracta concentra la lógica común.
 */
export abstract class LatencyDecorator<TRepo> {
  protected constructor(
    protected readonly inner: TRepo,
    private readonly delayMs: number,
  ) {}

  protected async delayed<T>(operation: () => Promise<T>): Promise<T> {
    await sleep(this.delayMs);
    return operation();
  }
}

export class LatencyReviewRepository extends LatencyDecorator<ReviewRepository> implements ReviewRepository {
  constructor(inner: ReviewRepository, delayMs: number) {
    super(inner, delayMs);
  }

  findByMovie(slug: Slug): Promise<Review[]> {
    return this.delayed(() => this.inner.findByMovie(slug));
  }
}

export class LatencyShowtimeRepository extends LatencyDecorator<ShowtimeRepository> implements ShowtimeRepository {
  constructor(inner: ShowtimeRepository, delayMs: number) {
    super(inner, delayMs);
  }

  findByCity(city: string, day: Date): Promise<Showtime[]> {
    return this.delayed(() => this.inner.findByCity(city, day));
  }

  findByMovie(slug: Slug, day: Date): Promise<Showtime[]> {
    return this.delayed(() => this.inner.findByMovie(slug, day));
  }
}

export class LatencyMovieRepository extends LatencyDecorator<MovieRepository> implements MovieRepository {
  constructor(inner: MovieRepository, delayMs: number) {
    super(inner, delayMs);
  }

  findAll(): Promise<Movie[]> {
    return this.delayed(() => this.inner.findAll());
  }

  findBySlug(slug: Slug): Promise<Movie | null> {
    return this.delayed(() => this.inner.findBySlug(slug));
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
