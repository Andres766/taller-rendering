import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DomainError, RateLimitError } from "@/domain/errors";
import type { RateLimitResult } from "@/infrastructure/security/RateLimiter";

const STATUS_BY_CODE: Record<DomainError["code"], number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
};

const NO_STORE = { "Cache-Control": "no-store" } as const;

/**
 * Traduce resultados y errores a respuestas HTTP homogéneas.
 * Los errores inesperados se registran en el servidor y el cliente solo
 * recibe un mensaje genérico (no se filtran stack traces).
 */
export class ApiResponder {
  static ok<T>(data: T, init: { headers?: Record<string, string> } = {}): NextResponse {
    return NextResponse.json({ data }, { status: 200, headers: { ...NO_STORE, ...init.headers } });
  }

  static error(error: unknown): NextResponse {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Parámetros inválidos",
            issues: error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
          },
        },
        { status: 400, headers: NO_STORE },
      );
    }

    if (error instanceof DomainError) {
      const headers: Record<string, string> = { ...NO_STORE };
      if (error instanceof RateLimitError) headers["Retry-After"] = String(error.retryAfterSeconds);
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: STATUS_BY_CODE[error.code], headers },
      );
    }

    console.error("[api] error inesperado", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Ocurrió un error interno" } },
      { status: 500, headers: NO_STORE },
    );
  }

  static rateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
      "RateLimit-Limit": String(result.limit),
      "RateLimit-Remaining": String(result.remaining),
    };
  }
}

/**
 * Identificador del cliente para el rate limiting. En Vercel `x-real-ip` lo
 * fija la plataforma (el cliente no puede falsificarlo); fuera de ella se usa
 * el primer valor de `x-forwarded-for` como aproximación.
 */
export function clientKey(headers: Headers): string {
  const ip =
    headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  return ip.slice(0, 64);
}
