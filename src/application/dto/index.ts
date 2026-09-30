import type { ShowtimeStatus } from "@/domain/entities/Showtime";
import type { Genre } from "@/domain/value-objects/Genre";

/**
 * DTOs: objetos planos y serializables que cruzan la frontera servidor → cliente.
 * Las entidades (clases con comportamiento) nunca salen de la capa de servidor;
 * React solo puede enviar datos planos a los Client Components.
 */
export interface MovieDTO {
  slug: string;
  title: string;
  synopsis: string;
  director: string;
  genres: Genre[];
  duration: string;
  durationMinutes: number | null;
  releaseDate: string;
  releaseYear: number;
  criticRating: number | null;
  stars: number | null;
  ageRating: string;
  palette: [string, string];
  posterUrl: string | null;
  popularity: number;
  isNewRelease: boolean;
}

export interface TrendingMovieDTO extends MovieDTO {
  trendingScore: number;
  position: number;
}

export interface ShowtimeDTO {
  id: string;
  movieSlug: string;
  cinema: string;
  city: string;
  room: string;
  startsAt: string;
  format: string;
  availableSeats: number;
  totalSeats: number;
  occupancyPercent: number;
  status: ShowtimeStatus;
}

export interface MovieBillboardDTO {
  movie: MovieDTO;
  showtimes: ShowtimeDTO[];
}

export interface ReviewDTO {
  id: string;
  author: string;
  rating: number | null;
  stars: number | null;
  comment: string;
  createdAt: string;
}

export interface ReviewSummaryDTO {
  average: number | null;
  count: number;
  reviews: ReviewDTO[];
}

export interface SearchResultDTO {
  items: MovieDTO[];
  total: number;
  query: { q: string; genre: Genre | null; sort: string };
}
