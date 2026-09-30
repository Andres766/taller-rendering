import { type FetchLike, HttpJsonClient } from "../http/HttpJsonClient";

export interface ItunesClientOptions {
  fetchImpl?: FetchLike;
  timeoutMs?: number;
  maxRetries?: number;
}

/**
 * Gateway hacia la API pública de iTunes (no requiere clave).
 * Apple limita la Search API a unas 20 solicitudes por minuto y responde 403
 * al excederla, así que aquí 403 también se reintenta.
 */
export class ItunesClient extends HttpJsonClient {
  protected readonly sourceName = "itunes";

  constructor(options: ItunesClientOptions = {}) {
    super({ baseUrl: "https://itunes.apple.com", maxRetries: 3, ...options });
  }

  protected override isRetriable(status: number): boolean {
    return status === 403 || super.isRetriable(status);
  }
}
