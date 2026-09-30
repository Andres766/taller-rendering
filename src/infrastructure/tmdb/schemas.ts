import { z } from "zod";

/**
 * Esquemas de las respuestas de TMDB. Una API externa también es entrada no
 * confiable: se validan tipos y se descartan campos desconocidos antes de que
 * los datos toquen el dominio.
 */
const nullableString = z.string().nullish().transform((v) => v ?? null);

export const tmdbListMovieSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  release_date: z.string().nullish(),
  popularity: z.number().nonnegative().catch(0),
});

export const nowPlayingSchema = z.object({
  page: z.number().int(),
  total_pages: z.number().int(),
  results: z.array(tmdbListMovieSchema).max(100),
});

export const movieDetailsSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  overview: z.string().nullish().transform((v) => v ?? ""),
  runtime: z.number().int().nullish().transform((v) => v ?? null),
  release_date: z.string().nullish().transform((v) => v ?? ""),
  vote_average: z.number().catch(0),
  popularity: z.number().nonnegative().catch(0),
  poster_path: nullableString,
  genres: z.array(z.object({ id: z.number().int(), name: z.string() })).catch([]),
  credits: z
    .object({
      crew: z.array(z.object({ job: z.string().nullish(), name: z.string() })).catch([]),
    })
    .nullish(),
  release_dates: z
    .object({
      results: z
        .array(
          z.object({
            iso_3166_1: z.string(),
            release_dates: z.array(z.object({ certification: z.string().nullish(), type: z.number().nullish() })).catch([]),
          }),
        )
        .catch([]),
    })
    .nullish(),
});
export type TmdbMovieDetails = z.infer<typeof movieDetailsSchema>;

export const reviewsSchema = z.object({
  results: z
    .array(
      z.object({
        id: z.string(),
        author: z.string(),
        content: z.string(),
        created_at: z.string(),
        author_details: z.object({ rating: z.number().nullish() }).nullish(),
      }),
    )
    .catch([]),
});
export type TmdbReviews = z.infer<typeof reviewsSchema>;
