import type { Clock } from "@/domain/repositories";

interface CacheEntry<T> {
  value: Promise<T>;
  expiresAt: number;
}

/**
 * Caché en memoria con expiración (TTL) y "single-flight": si llegan varias
 * solicitudes a la vez por la misma clave, comparten una sola promesa en vez
 * de disparar N llamadas a la API externa. Si la carga falla, la entrada se
 * descarta para que el siguiente intento vuelva a consultar.
 */
export class TtlCache {
  private readonly entries = new Map<string, CacheEntry<unknown>>();

  constructor(
    private readonly clock: Clock,
    private readonly ttlMs: number,
    private readonly maxEntries = 500,
  ) {}

  getOrLoad<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const now = this.clock.now().getTime();
    const hit = this.entries.get(key) as CacheEntry<T> | undefined;
    if (hit && hit.expiresAt > now) return hit.value;

    const value = loader();
    this.entries.set(key, { value, expiresAt: now + this.ttlMs });
    value.catch(() => {
      if (this.entries.get(key)?.value === value) this.entries.delete(key);
    });
    this.evictIfNeeded();
    return value;
  }

  clear(): void {
    this.entries.clear();
  }

  private evictIfNeeded(): void {
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) break;
      this.entries.delete(oldest);
    }
  }
}
