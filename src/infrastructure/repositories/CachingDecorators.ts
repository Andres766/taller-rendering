import type { Movie } from "@/domain/entities/Movie";
import type { Review } from "@/domain/entities/Review";
import type { MovieRepository, ReviewRepository } from "@/domain/repositories";
import type { Slug } from "@/domain/value-objects/Slug";
import type { TtlCache } from "../cache/TtlCache";

/**
 * Patrón Decorator (Cache-Aside): agrega caché a cualquier repositorio sin
 * que este lo sepa. Protege la cuota de la API externa: aunque /ssr se
 * renderice en cada visita, TMDB se consulta como máximo una vez por TTL.
 */
export class CachingMovieRepository implements MovieRepository {
  constructor(
    private readonly inner: MovieRepository,
    private readonly cache: TtlCache,
  ) {}

  findAll(): Promise<Movie[]> {
    return this.cache.getOrLoad("movies:all", () => this.inner.findAll());
  }

  /**
   * Primero busca en el catálogo ya cacheado (0 solicitudes extra); solo si no
   * está, consulta la fuente. Clave para APIs con rate limit estricto (iTunes).
   */
  async findBySlug(slug: Slug): Promise<Movie | null> {
    const hit = (await this.findAll()).find((m) => m.slug.equals(slug));
    if (hit) return hit;
    return this.cache.getOrLoad(`movies:slug:${slug.toString()}`, () => this.inner.findBySlug(slug));
  }
}

export class CachingReviewRepository implements ReviewRepository {
  constructor(
    private readonly inner: ReviewRepository,
    private readonly cache: TtlCache,
  ) {}

  findByMovie(slug: Slug): Promise<Review[]> {
    return this.cache.getOrLoad(`reviews:${slug.toString()}`, () => this.inner.findByMovie(slug));
  }
}
