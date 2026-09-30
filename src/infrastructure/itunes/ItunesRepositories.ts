import { Movie } from "@/domain/entities/Movie";
import { Review } from "@/domain/entities/Review";
import type { MovieRepository, ReviewRepository } from "@/domain/repositories";
import type { Slug } from "@/domain/value-objects/Slug";
import { idFromSlug } from "../util/slugify";
import type { ItunesClient } from "./ItunesClient";
import { ItunesMapper } from "./ItunesMapper";
import { customerReviewsSchema, lookupSchema, topMoviesFeedSchema } from "./schemas";

export interface ItunesCatalogOptions {
  /** País de la tienda (ISO 3166-1), p. ej. "CO". */
  country: string;
  limit?: number;
  /** Tiendas donde buscar reseñas si el país principal no tiene. */
  fallbackCountries?: string[];
}

/**
 * Adaptador de MovieRepository sobre la tienda de iTunes: el Top de películas
 * del país, con detalles en español. Solo usa 2 solicitudes para todo el
 * catálogo (feed + un /lookup con todos los ids), para respetar el rate limit.
 */
export class ItunesMovieRepository implements MovieRepository {
  private readonly mapper = new ItunesMapper();

  constructor(
    private readonly client: ItunesClient,
    private readonly options: ItunesCatalogOptions,
  ) {}

  async findAll(): Promise<Movie[]> {
    const country = this.options.country.toLowerCase();
    const limit = Math.min(Math.max(this.options.limit ?? 24, 1), 50);
    const feed = await this.client.get(`/${country}/rss/topmovies/limit=${limit}/json`, {}, topMoviesFeedSchema);
    const ids = [...new Set(feed.feed.entry.map((e) => e.id.attributes["im:id"]))];
    if (ids.length === 0) return [];

    return this.lookup(ids);
  }

  async findBySlug(slug: Slug): Promise<Movie | null> {
    const id = idFromSlug(slug.toString());
    if (id === null) return null;
    const [movie] = await this.lookup([String(id)]);
    // Solo el slug canónico resuelve la película (evita URLs duplicadas para la misma ficha).
    return movie && movie.slug.equals(slug) ? movie : null;
  }

  private async lookup(ids: string[]): Promise<Movie[]> {
    const data = await this.client.get(
      "/lookup",
      { id: ids.join(","), country: this.options.country.toLowerCase(), lang: "es_es" },
      lookupSchema,
    );
    const byId = new Map(data.results.map((r) => [String(r.trackId), r]));

    // Se conserva el orden del Top: la posición define la popularidad.
    return ids.flatMap((id, rank) => {
      const item = byId.get(id);
      const props = item && this.mapper.toMovieProps(item, rank, ids.length);
      if (!props) return [];
      try {
        return [Movie.create(props)];
      } catch (error) {
        console.warn(`[itunes] película ${id} descartada: ${(error as Error).message}`);
        return [];
      }
    });
  }
}

/** Reseñas reales de clientes de la tienda de iTunes del país configurado. */
export class ItunesReviewRepository implements ReviewRepository {
  private readonly mapper = new ItunesMapper();

  constructor(
    private readonly client: ItunesClient,
    private readonly options: ItunesCatalogOptions,
  ) {}

  /**
   * Las reseñas escasean: si la tienda del país no tiene, se prueba en las
   * tiendas de respaldo (por defecto México, también en español), en orden.
   */
  async findByMovie(slug: Slug): Promise<Review[]> {
    const id = idFromSlug(slug.toString());
    if (id === null) return [];

    const countries = [this.options.country, ...(this.options.fallbackCountries ?? ["MX"])].map((c) => c.toLowerCase());
    for (const country of [...new Set(countries)]) {
      const feed = await this.client.get(`/${country}/rss/customerreviews/id=${id}/sortby=mostrecent/json`, {}, customerReviewsSchema);
      const reviews = this.mapper.toReviewProps(slug.toString(), feed, this.options.limit ?? 5).flatMap((props) => {
        try {
          return [Review.create(props)];
        } catch {
          return [];
        }
      });
      if (reviews.length > 0) return reviews;
    }
    return [];
  }
}
