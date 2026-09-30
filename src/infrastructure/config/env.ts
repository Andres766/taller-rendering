import "server-only";
import { z } from "zod";

/**
 * Variables de entorno validadas al arrancar. `server-only` hace que el build
 * falle si algún Client Component intenta importar este módulo, de modo que
 * los secretos (token de TMDB, secreto de revalidación) nunca terminan en el
 * bundle del navegador.
 */
const optionalSecret = (min: number, name: string) =>
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? undefined : v))
    .pipe(z.string().min(min, `${name} debe tener al menos ${min} caracteres`).max(2048).regex(/^[\w.\-]+$/).optional())
    .optional();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  REVALIDATE_SECRET: optionalSecret(32, "REVALIDATE_SECRET"),
  /** "API Read Access Token" de https://www.themoviedb.org/settings/api */
  TMDB_API_TOKEN: optionalSecret(20, "TMDB_API_TOKEN"),
  /**
   * auto  → TMDB si hay token; si no, iTunes (real y sin clave).
   * tmdb | itunes | demo → fuerza una fuente concreta.
   */
  CATALOG_SOURCE: z.enum(["auto", "tmdb", "itunes", "demo"]).default("auto"),
  CATALOG_REGION: z.string().regex(/^[A-Z]{2}$/).default("CO"),
  CATALOG_LANGUAGE: z.string().regex(/^[a-z]{2}-[A-Z]{2}$/).default("es-CO"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (!cached) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      // Solo se reportan los nombres de las variables, nunca sus valores.
      const fields = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
      throw new Error(`Configuración de entorno inválida: ${fields}`);
    }
    cached = parsed.data;
  }
  return cached;
}
