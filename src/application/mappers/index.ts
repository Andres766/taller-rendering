import type { Movie } from "@/domain/entities/Movie";
import type { Review } from "@/domain/entities/Review";
import type { Showtime } from "@/domain/entities/Showtime";
import type { MovieDTO, ReviewDTO, ShowtimeDTO } from "../dto";

/** Patrón Mapper (Data Mapper): traduce entidades de dominio a DTOs planos. */
export class MovieMapper {
  static toDTO(movie: Movie, now: Date): MovieDTO {
    const release = movie.releaseDate;
    return {
      slug: movie.slug.toString(),
      title: movie.title,
      synopsis: movie.synopsis,
      director: movie.director,
      genres: [...movie.genres],
      duration: movie.duration?.format() ?? "Duración por confirmar",
      durationMinutes: movie.duration?.totalMinutes ?? null,
      releaseDate: release.toISOString().slice(0, 10),
      releaseYear: release.getUTCFullYear(),
      criticRating: movie.criticRating?.value ?? null,
      stars: movie.criticRating?.stars ?? null,
      ageRating: movie.ageRating,
      palette: [movie.palette[0], movie.palette[1]],
      posterUrl: movie.posterUrl,
      popularity: movie.popularity,
      isNewRelease: movie.isNewRelease(now),
    };
  }
}

export class ShowtimeMapper {
  static toDTO(showtime: Showtime, now: Date): ShowtimeDTO {
    return {
      id: showtime.id,
      movieSlug: showtime.movieSlug.toString(),
      cinema: showtime.cinema,
      city: showtime.city,
      room: showtime.room,
      startsAt: showtime.startsAt.toISOString(),
      format: showtime.format,
      availableSeats: showtime.availableSeats,
      totalSeats: showtime.totalSeats,
      occupancyPercent: Math.round(showtime.occupancy * 100),
      status: showtime.statusAt(now),
    };
  }
}

export class ReviewMapper {
  static toDTO(review: Review): ReviewDTO {
    return {
      id: review.id,
      author: review.author,
      rating: review.rating?.value ?? null,
      stars: review.rating?.stars ?? null,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
    };
  }
}
