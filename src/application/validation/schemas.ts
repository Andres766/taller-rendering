import { z } from "zod";
import { GENRES } from "@/domain/value-objects/Genre";
import { SORT_KEYS } from "../sorting/MovieSortStrategy";

/**
 * Validación en el borde (toda entrada externa es no confiable):
 * query strings, cuerpos JSON y parámetros de ruta pasan por estos esquemas
 * antes de llegar a los servicios. Listas blancas en vez de listas negras.
 */
export const CITIES = ["Pasto", "Bogotá", "Medellín", "Cali"] as const;
export type City = (typeof CITIES)[number];

export const searchQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(60, "La búsqueda admite máximo 60 caracteres")
    .regex(/^[\p{L}\p{N}\s'.,:-]*$/u, "La búsqueda contiene caracteres no permitidos")
    .default(""),
  genre: z.enum(GENRES).optional(),
  sort: z.enum(SORT_KEYS).default("rating"),
});
export type SearchQuery = z.infer<typeof searchQuerySchema>;

export const citySchema = z.enum(CITIES).catch("Pasto");

export const slugParamSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const revalidateBodySchema = z
  .object({
    slug: slugParamSchema.optional(),
  })
  .strict();

/** Convierte URLSearchParams (o el objeto searchParams de Next) a un objeto simple con un valor por clave. */
export function firstValues(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
): Record<string, string | undefined> {
  if (params instanceof URLSearchParams) {
    return Object.fromEntries([...params.keys()].map((k) => [k, params.get(k) ?? undefined]));
  }
  return Object.fromEntries(
    Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
}
