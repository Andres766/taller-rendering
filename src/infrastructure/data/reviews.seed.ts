import type { ReviewProps } from "@/domain/entities/Review";
import { MOVIES_SEED } from "./movies.seed";

const AUTHORS = ["Valentina R.", "Camilo M.", "Sara P.", "Andrés C.", "Laura G.", "Julián E.", "Mariana T."];
const COMMENTS = [
  "La fotografía es espectacular, cada plano parece una pintura.",
  "Buen ritmo, aunque el segundo acto se siente un poco largo.",
  "La banda sonora me acompañó toda la semana. Muy recomendada.",
  "Actuaciones sólidas; el final me dejó pensando varios días.",
  "Ideal para ver en familia, salimos todos contentos.",
  "Esperaba más del guion, pero visualmente cumple.",
  "Una de las mejores producciones regionales de los últimos años.",
];

/** Reseñas generadas de forma determinista a partir del catálogo. */
export const REVIEWS_SEED: readonly ReviewProps[] = MOVIES_SEED.flatMap((movie, m) =>
  Array.from({ length: 3 + (m % 3) }, (_, i) => {
    const offset = Math.round(((m * 7 + i * 3) % 10) / 3) - 1; // -1..2
    return {
      id: `${movie.slug}-r${i + 1}`,
      movieSlug: movie.slug,
      author: AUTHORS[(m + i) % AUTHORS.length],
      rating: Math.max(0, Math.min(10, (movie.criticRating ?? 7) + offset * 0.6)),
      comment: COMMENTS[(m * 2 + i) % COMMENTS.length],
      createdAt: new Date(Date.UTC(2026, 8, 1 + ((m + i * 5) % 27), 15, 0)).toISOString(),
    };
  }),
);

export const CINEMAS: Readonly<Record<string, readonly string[]>> = {
  Pasto: ["Unicentro Pasto", "Único Outlet"],
  Bogotá: ["Andino", "Titán Plaza", "Gran Estación"],
  Medellín: ["El Tesoro", "Santafé"],
  Cali: ["Chipichape", "Jardín Plaza"],
};
