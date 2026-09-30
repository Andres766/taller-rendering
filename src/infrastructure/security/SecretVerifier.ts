import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Compara un token recibido contra el secreto configurado en tiempo constante,
 * evitando ataques de temporización (timing attacks). Se comparan los hash
 * SHA-256 para que ambos buffers tengan siempre la misma longitud.
 */
export class SecretVerifier {
  private readonly expectedDigest: Buffer | null;

  constructor(secret: string | undefined) {
    this.expectedDigest = secret ? digest(secret) : null;
  }

  get isConfigured(): boolean {
    return this.expectedDigest !== null;
  }

  verify(candidate: string | null | undefined): boolean {
    if (!this.expectedDigest || !candidate) return false;
    return timingSafeEqual(digest(candidate), this.expectedDigest);
  }

  /** Extrae el token de un encabezado `Authorization: Bearer <token>`. */
  static bearerToken(header: string | null): string | null {
    if (!header) return null;
    const match = /^Bearer\s+(\S{1,256})$/i.exec(header.trim());
    return match ? match[1] : null;
  }
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}
