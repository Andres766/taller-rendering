import { z } from "zod";

/** Los feeds RSS de Apple devuelven un objeto cuando hay un solo elemento y un arreglo cuando hay varios. */
function oneOrMany<T extends z.ZodType>(item: T) {
  return z
    .union([z.array(item), item])
    .nullish()
    .transform((v): z.infer<T>[] => (v == null ? [] : Array.isArray(v) ? v : [v]));
}

const label = z.object({ label: z.string() });

/** Feed "Top películas" de iTunes: solo interesa el id y el orden (ranking). */
export const topMoviesFeedSchema = z.object({
  feed: z.object({
    entry: oneOrMany(
      z.object({
        id: z.object({ attributes: z.object({ "im:id": z.string().regex(/^\d{1,12}$/) }) }),
      }),
    ),
  }),
});

/** Respuesta de /lookup (iTunes Search API). */
export const lookupSchema = z.object({
  resultCount: z.number().int(),
  results: z
    .array(
      z.object({
        kind: z.string().nullish(),
        trackId: z.number().int().positive(),
        trackName: z.string(),
        artistName: z.string().nullish(),
        artworkUrl100: z.string().nullish(),
        releaseDate: z.string().nullish(),
        trackTimeMillis: z.number().nullish(),
        primaryGenreName: z.string().nullish(),
        contentAdvisoryRating: z.string().nullish(),
        longDescription: z.string().nullish(),
        shortDescription: z.string().nullish(),
      }),
    )
    .max(200),
});
export type ItunesLookupItem = z.infer<typeof lookupSchema>["results"][number];

/** Feed de reseñas de clientes de la tienda de iTunes. */
export const customerReviewsSchema = z.object({
  feed: z.object({
    entry: oneOrMany(
      z.object({
        id: label,
        author: z.object({ name: label }),
        "im:rating": label.nullish(),
        title: label.nullish(),
        content: label.nullish(),
        updated: label.nullish(),
      }),
    ),
  }),
});
export type ItunesReviewsFeed = z.infer<typeof customerReviewsSchema>;
