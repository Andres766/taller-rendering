import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { revalidateBodySchema } from "@/application/validation/schemas";
import { RateLimitError, UnauthorizedError, ValidationError } from "@/domain/errors";
import { container } from "@/infrastructure/container";
import { SecretVerifier } from "@/infrastructure/security/SecretVerifier";
import { ApiResponder, clientKey } from "@/presentation/http/ApiResponder";

const MAX_BODY_BYTES = 1024;

/**
 * POST /api/revalidate — Revalidación ISR bajo demanda.
 * Requiere `Authorization: Bearer <REVALIDATE_SECRET>`. Pensado para que un
 * CMS o un webhook avise que cambió una película y la página se regenere
 * sin esperar el intervalo de `revalidate`.
 */
export async function POST(request: NextRequest) {
  try {
    const { revalidationSecret, adminRateLimiter } = container();

    // 1) Rate limit antes de cualquier trabajo: frena fuerza bruta sobre el secreto.
    const limit = adminRateLimiter.consume(clientKey(request.headers));
    if (!limit.allowed) throw new RateLimitError(limit.retryAfterSeconds);

    // 2) Autenticación en tiempo constante.
    const token = SecretVerifier.bearerToken(request.headers.get("authorization"));
    if (!revalidationSecret.verify(token)) throw new UnauthorizedError();

    // 3) Cuerpo acotado y validado con lista blanca.
    const body = revalidateBodySchema.parse(await readJson(request));

    const paths = body.slug ? [`/isr/${body.slug}`, "/isr"] : ["/isr"];
    paths.forEach((p) => revalidatePath(p));
    if (!body.slug) revalidatePath("/isr/[slug]", "page");

    return ApiResponder.ok({ revalidated: body.slug ? paths : [...paths, "/isr/[slug]"], at: new Date().toISOString() });
  } catch (error) {
    return ApiResponder.error(error);
  }
}

async function readJson(request: NextRequest): Promise<unknown> {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) throw new ValidationError("Cuerpo demasiado grande");
  if (raw.trim() === "") return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new ValidationError("JSON inválido");
  }
}
