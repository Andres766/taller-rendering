import type { Clock } from "@/domain/repositories";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  limit: number;
}

export interface RateLimiter {
  consume(key: string): RateLimitResult;
}

interface Bucket {
  tokens: number;
  updatedAt: number;
}

/**
 * Limitador de tasa con algoritmo Token Bucket (en memoria).
 *
 * Protege la API contra abuso/scraping. La cantidad de claves está acotada
 * (`maxKeys`) para que un atacante que rote IPs no agote la memoria.
 * En producción con varias instancias se reemplazaría por una implementación
 * sobre Redis que cumpla la misma interfaz `RateLimiter`.
 */
export class TokenBucketRateLimiter implements RateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly clock: Clock,
    private readonly capacity = 20,
    private readonly refillPerSecond = 0.5,
    private readonly maxKeys = 10_000,
  ) {}

  consume(key: string): RateLimitResult {
    const now = this.clock.now().getTime();
    const bucket = this.refill(this.buckets.get(key), now);

    const allowed = bucket.tokens >= 1;
    if (allowed) bucket.tokens -= 1;

    this.buckets.delete(key); // re-inserción → la clave pasa al final (orden LRU)
    this.buckets.set(key, bucket);
    this.evictIfNeeded();

    return {
      allowed,
      limit: this.capacity,
      remaining: Math.floor(bucket.tokens),
      retryAfterSeconds: allowed ? 0 : Math.ceil((1 - bucket.tokens) / this.refillPerSecond),
    };
  }

  private refill(bucket: Bucket | undefined, now: number): Bucket {
    if (!bucket) return { tokens: this.capacity, updatedAt: now };
    const elapsedSeconds = Math.max(0, now - bucket.updatedAt) / 1000;
    return {
      tokens: Math.min(this.capacity, bucket.tokens + elapsedSeconds * this.refillPerSecond),
      updatedAt: now,
    };
  }

  private evictIfNeeded(): void {
    while (this.buckets.size > this.maxKeys) {
      const oldest = this.buckets.keys().next().value;
      if (oldest === undefined) break;
      this.buckets.delete(oldest);
    }
  }
}
