import { type FetchLike, HttpJsonClient, HttpSourceError } from "../http/HttpJsonClient";

export type { FetchLike };
/** Alias para legibilidad en el código de TMDB. */
export { HttpSourceError as TmdbError };

export interface TmdbClientOptions {
  /** "API Read Access Token" (v4) de TMDB. Se envía en el encabezado, nunca en la URL. */
  token: string;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
  maxRetries?: number;
}

/** Gateway hacia la API de TMDB: autenticación Bearer sobre el cliente HTTP seguro. */
export class TmdbClient extends HttpJsonClient {
  protected readonly sourceName = "tmdb";

  constructor(private readonly tmdb: TmdbClientOptions) {
    super({ baseUrl: "https://api.themoviedb.org/3", ...tmdb });
  }

  protected override headers(): Record<string, string> {
    return { Authorization: `Bearer ${this.tmdb.token}` };
  }
}
