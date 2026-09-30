import { ValidationError } from "../errors";

/** Value Object: duración de una película en minutos. */
export class Duration {
  private constructor(private readonly minutes: number) {
    Object.freeze(this);
  }

  static ofMinutes(minutes: number): Duration {
    if (!Number.isInteger(minutes) || minutes <= 0 || minutes > 600) {
      throw new ValidationError("La duración debe ser un número entero de minutos entre 1 y 600");
    }
    return new Duration(minutes);
  }

  get totalMinutes(): number {
    return this.minutes;
  }

  /** Ej.: 125 → "2 h 5 min" */
  format(): string {
    const hours = Math.floor(this.minutes / 60);
    const rest = this.minutes % 60;
    if (hours === 0) return `${rest} min`;
    return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
  }
}
