import type { SearchResultDTO } from "@/application/dto";

export interface SearchParams {
  q: string;
  genre: string;
  sort: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Patrón Gateway: encapsula el acceso HTTP a la API desde el navegador.
 * Los componentes no conocen URLs, encabezados ni formato de errores.
 */
export class MovieApiClient {
  constructor(private readonly baseUrl = "/api/movies") {}

  async search(params: SearchParams, signal?: AbortSignal): Promise<SearchResultDTO> {
    const qs = new URLSearchParams();
    if (params.q.trim()) qs.set("q", params.q.trim());
    if (params.genre) qs.set("genre", params.genre);
    qs.set("sort", params.sort);

    const response = await fetch(`${this.baseUrl}?${qs.toString()}`, {
      signal,
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });

    const body: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        (isRecord(body) && isRecord(body.error) && typeof body.error.message === "string" && body.error.message) ||
        "No se pudo completar la búsqueda";
      throw new ApiError(response.status === 429 ? "Demasiadas búsquedas, espera un momento." : message, response.status);
    }
    if (!isRecord(body) || !isRecord(body.data) || !Array.isArray(body.data.items)) {
      throw new ApiError("Respuesta inesperada del servidor", response.status);
    }
    return body.data as unknown as SearchResultDTO;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
