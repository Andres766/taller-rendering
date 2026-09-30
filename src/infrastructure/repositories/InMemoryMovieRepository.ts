import { Movie, type MovieProps } from "@/domain/entities/Movie";
import type { MovieRepository } from "@/domain/repositories";
import type { Slug } from "@/domain/value-objects/Slug";

/**
 * Adaptador de persistencia en memoria. Reemplazarlo por uno que use
 * PostgreSQL o una API externa no requiere tocar servicios ni páginas.
 */
export class InMemoryMovieRepository implements MovieRepository {
  private readonly bySlug: ReadonlyMap<string, Movie>;

  constructor(seed: readonly MovieProps[]) {
    this.bySlug = new Map(seed.map((props) => {
      const movie = Movie.create(props);
      return [movie.slug.toString(), movie];
    }));
  }

  async findAll(): Promise<Movie[]> {
    return [...this.bySlug.values()];
  }

  async findBySlug(slug: Slug): Promise<Movie | null> {
    return this.bySlug.get(slug.toString()) ?? null;
  }
}
