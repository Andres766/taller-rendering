import type { Movie } from "../entities/Movie";
import type { Review } from "../entities/Review";
import type { Showtime } from "../entities/Showtime";
import type { Slug } from "../value-objects/Slug";

/**
 * Puertos (interfaces) de persistencia. El dominio y la capa de aplicación
 * dependen de estas abstracciones, nunca de una implementación concreta
 * (Principio de Inversión de Dependencias).
 */
export interface MovieRepository {
  findAll(): Promise<Movie[]>;
  findBySlug(slug: Slug): Promise<Movie | null>;
}

export interface ShowtimeRepository {
  findByCity(city: string, day: Date): Promise<Showtime[]>;
  findByMovie(slug: Slug, day: Date): Promise<Showtime[]>;
}

export interface ReviewRepository {
  findByMovie(slug: Slug): Promise<Review[]>;
}

/** Puerto de tiempo: permite congelar el reloj en las pruebas. */
export interface Clock {
  now(): Date;
}
