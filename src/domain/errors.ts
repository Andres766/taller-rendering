/**
 * Jerarquía de errores del dominio.
 * La capa de presentación traduce cada `code` a un status HTTP sin filtrar
 * detalles internos (stack traces, rutas, etc.) al cliente.
 */
export abstract class DomainError extends Error {
  abstract readonly code: "VALIDATION_ERROR" | "NOT_FOUND" | "RATE_LIMITED" | "UNAUTHORIZED";

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends DomainError {
  readonly code = "VALIDATION_ERROR" as const;

  constructor(message: string) {
    super(message);
  }
}

export class NotFoundError extends DomainError {
  readonly code = "NOT_FOUND" as const;

  constructor(resource: string, id: string) {
    super(`${resource} "${id}" no existe`);
  }
}

export class RateLimitError extends DomainError {
  readonly code = "RATE_LIMITED" as const;

  constructor(readonly retryAfterSeconds: number) {
    super("Demasiadas solicitudes");
  }
}

export class UnauthorizedError extends DomainError {
  readonly code = "UNAUTHORIZED" as const;

  constructor() {
    super("No autorizado");
  }
}
