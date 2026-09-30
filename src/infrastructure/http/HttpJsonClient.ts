import type { z } from "zod";

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface HttpJsonClientOptions {
  baseUrl: string;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
  maxRetries?: number;
}

export class HttpSourceError extends Error {
  constructor(
    readonly source: string,
    message: string,
    readonly status?: number,
  ) {
    super(`[${source}] ${message}`);
    this.name = "HttpSourceError";
  }
}

const SAFE_PATH = /^\/[a-z0-9_=/-]+$/i; // sin "?", "#", "%" ni ".." (la query se arma aparte)
const SAFE_PARAM = /^[\w.,-]{0,2048}$/;

/**
 * Clase base (Template Method) para consumir APIs JSON externas de forma segura:
 * - Solo rutas y parámetros de una lista blanca de caracteres (sin inyección en la URL).
 * - Tiempo límite por solicitud (AbortSignal.timeout) para no colgar el render.
 * - Reintentos con espera ante 429/5xx, respetando Retry-After.
 * - Validación del JSON con Zod: la API externa es entrada no confiable.
 * Las subclases solo definen su nombre y sus encabezados (p. ej. autenticación).
 * `fetchImpl` se inyecta para probar sin red.
 */
export abstract class HttpJsonClient {
  protected abstract readonly sourceName: string;

  private readonly fetchImpl: FetchLike;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  protected constructor(private readonly options: HttpJsonClientOptions) {
    this.fetchImpl = options.fetchImpl ?? ((input, init) => fetch(input, init));
    this.timeoutMs = options.timeoutMs ?? 8000;
    this.maxRetries = options.maxRetries ?? 2;
  }

  /** Gancho para las subclases: encabezados extra (autenticación, etc.). */
  protected headers(): Record<string, string> {
    return {};
  }

  async get<S extends z.ZodType>(path: string, params: Record<string, string>, schema: S): Promise<z.infer<S>> {
    if (!SAFE_PATH.test(path) || path.includes("..")) throw this.error("Ruta inválida");
    const url = new URL(this.options.baseUrl + path);
    for (const [key, value] of Object.entries(params)) {
      if (!SAFE_PARAM.test(value)) throw this.error(`Parámetro inválido: ${key}`);
      url.searchParams.set(key, value);
    }

    const response = await this.fetchWithRetry(url.toString());
    let json: unknown;
    try {
      json = await response.json();
    } catch {
      throw this.error("JSON inválido", response.status);
    }
    const parsed = schema.safeParse(json);
    if (!parsed.success) throw this.error(`Respuesta inesperada en ${path}`);
    return parsed.data;
  }

  /** Gancho: qué status merecen reintento. Por defecto 429 y 5xx. */
  protected isRetriable(status: number): boolean {
    return status === 429 || status >= 500;
  }

  protected error(message: string, status?: number): HttpSourceError {
    return new HttpSourceError(this.sourceName, message, status);
  }

  private async fetchWithRetry(url: string): Promise<Response> {
    for (let attempt = 0; ; attempt++) {
      let response: Response;
      try {
        response = await this.fetchImpl(url, {
          headers: { Accept: "application/json", ...this.headers() },
          signal: AbortSignal.timeout(this.timeoutMs),
          // Sin opción de caché de Next a propósito: así cada página conserva SU patrón
          // (SSG = una vez en el build, ISR = en cada regeneración, SSR = por solicitud).
          // Un `next.revalidate` aquí convertiría las páginas SSG en ISR. La cuota de la API
          // la protege el decorador CachingMovieRepository (TTL en memoria).
        });
      } catch (error) {
        if (attempt >= this.maxRetries) throw this.error(`No respondió (${(error as Error).name})`);
        await wait(backoff(attempt));
        continue;
      }

      if (response.ok) return response;
      if (response.status === 404) throw this.error("Recurso no encontrado", 404);

      const retriable = this.isRetriable(response.status);
      if (!retriable && (response.status === 401 || response.status === 403)) {
        throw this.error("Credenciales inválidas", response.status);
      }
      if (!retriable || attempt >= this.maxRetries) throw this.error(`Respondió ${response.status}`, response.status);
      const retryAfter = Number(response.headers.get("retry-after"));
      await wait(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 5) * 1000 : backoff(attempt));
    }
  }
}

function backoff(attempt: number): number {
  return 400 * 2 ** attempt;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
