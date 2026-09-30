import type { Movie } from "../entities/Movie";

export interface TrendingEntry {
  movie: Movie;
  score: number; // 0–100
}

/**
 * Servicio de dominio: ordena el catálogo por popularidad y normaliza el
 * puntaje de 0 a 100 respecto a la película más popular del momento.
 * Desempata por calificación de la crítica.
 */
export class TrendingCalculator {
  rank(movies: readonly Movie[]): TrendingEntry[] {
    const max = Math.max(0, ...movies.map((m) => m.popularity));
    return movies
      .map((movie) => ({
        movie,
        score: max === 0 ? 0 : Math.round((movie.popularity / max) * 100),
      }))
      .sort((a, b) => b.movie.popularity - a.movie.popularity || (b.movie.criticRating?.value ?? 0) - (a.movie.criticRating?.value ?? 0));
  }
}
