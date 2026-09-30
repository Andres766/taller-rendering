import { ValidationError } from "../errors";

/**
 * Value Object: identificador legible de una película usado en las URLs.
 * Inmutable y siempre válido: si existe una instancia, su valor es seguro
 * para usarse en rutas (evita path traversal e inyección en la URL).
 */
export class Slug {
  private static readonly PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  private static readonly MAX_LENGTH = 80;

  private constructor(private readonly value: string) {
    Object.freeze(this);
  }

  static create(raw: string): Slug {
    const candidate = raw.trim().toLowerCase();
    if (candidate.length === 0 || candidate.length > Slug.MAX_LENGTH) {
      throw new ValidationError("El identificador tiene una longitud inválida");
    }
    if (!Slug.PATTERN.test(candidate)) {
      throw new ValidationError("El identificador contiene caracteres no permitidos");
    }
    return new Slug(candidate);
  }

  equals(other: Slug): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
