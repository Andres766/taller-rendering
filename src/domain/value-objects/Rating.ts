import { ValidationError } from "../errors";

/** Value Object: calificación entre 0 y 10 con un decimal. */
export class Rating {
  static readonly MIN = 0;
  static readonly MAX = 10;

  private constructor(private readonly score: number) {
    Object.freeze(this);
  }

  static of(score: number): Rating {
    if (!Number.isFinite(score) || score < Rating.MIN || score > Rating.MAX) {
      throw new ValidationError(`La calificación debe estar entre ${Rating.MIN} y ${Rating.MAX}`);
    }
    return new Rating(Math.round(score * 10) / 10);
  }

  /** Promedio de varias calificaciones; devuelve null si no hay ninguna. */
  static average(ratings: readonly Rating[]): Rating | null {
    if (ratings.length === 0) return null;
    const total = ratings.reduce((sum, r) => sum + r.score, 0);
    return Rating.of(total / ratings.length);
  }

  get value(): number {
    return this.score;
  }

  /** Equivalente en estrellas (0–5) para la interfaz. */
  get stars(): number {
    return Math.round(this.score / 2);
  }

  isAbove(other: Rating): boolean {
    return this.score > other.score;
  }
}
