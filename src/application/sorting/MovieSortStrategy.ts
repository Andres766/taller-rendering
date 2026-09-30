import type { Movie } from "@/domain/entities/Movie";

/**
 * Patrón Strategy: cada criterio de ordenamiento es una clase intercambiable.
 * Agregar un criterio nuevo no obliga a modificar el servicio (Open/Closed).
 */
export interface MovieSortStrategy {
  readonly key: string;
  readonly label: string;
  compare(a: Movie, b: Movie): number;
}

export class SortByRating implements MovieSortStrategy {
  readonly key = "rating";
  readonly label = "Mejor calificadas";
  compare(a: Movie, b: Movie): number {
    // Sin calificación (-1) queda al final.
    return (b.criticRating?.value ?? -1) - (a.criticRating?.value ?? -1) || a.title.localeCompare(b.title, "es");
  }
}

export class SortByTitle implements MovieSortStrategy {
  readonly key = "title";
  readonly label = "Título (A–Z)";
  compare(a: Movie, b: Movie): number {
    return a.title.localeCompare(b.title, "es");
  }
}

export class SortByRelease implements MovieSortStrategy {
  readonly key = "release";
  readonly label = "Más recientes";
  compare(a: Movie, b: Movie): number {
    return b.releaseDate.getTime() - a.releaseDate.getTime();
  }
}

export class SortByDuration implements MovieSortStrategy {
  readonly key = "duration";
  readonly label = "Más cortas";
  compare(a: Movie, b: Movie): number {
    // Las películas sin duración publicada van al final.
    const [da, db] = [a.duration?.totalMinutes ?? null, b.duration?.totalMinutes ?? null];
    if (da === null || db === null) return da === db ? 0 : da === null ? 1 : -1;
    return da - db;
  }
}

/** Registro/fábrica de estrategias disponibles. */
export class SortStrategyRegistry {
  private readonly strategies: ReadonlyMap<string, MovieSortStrategy>;

  constructor(
    strategies: MovieSortStrategy[] = [new SortByRating(), new SortByTitle(), new SortByRelease(), new SortByDuration()],
  ) {
    this.strategies = new Map(strategies.map((s) => [s.key, s]));
  }

  get defaultStrategy(): MovieSortStrategy {
    return this.strategies.values().next().value!;
  }

  resolve(key: string | undefined): MovieSortStrategy {
    return (key && this.strategies.get(key)) || this.defaultStrategy;
  }

  keys(): string[] {
    return [...this.strategies.keys()];
  }

  options(): { key: string; label: string }[] {
    return [...this.strategies.values()].map(({ key, label }) => ({ key, label }));
  }
}

export const SORT_KEYS = ["rating", "title", "release", "duration"] as const;
export type SortKey = (typeof SORT_KEYS)[number];
