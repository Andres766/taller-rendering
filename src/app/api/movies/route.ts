import type { NextRequest } from "next/server";
import { firstValues, searchQuerySchema } from "@/application/validation/schemas";
import { RateLimitError } from "@/domain/errors";
import { container } from "@/infrastructure/container";
import { ApiResponder, clientKey } from "@/presentation/http/ApiResponder";

/**
 * GET /api/movies?q=&genre=&sort=
 * Endpoint consumido por la página CSR (el navegador pide los datos en JSON).
 */
export async function GET(request: NextRequest) {
  try {
    const { catalog, apiRateLimiter } = container();

    const limit = apiRateLimiter.consume(clientKey(request.headers));
    if (!limit.allowed) throw new RateLimitError(limit.retryAfterSeconds);

    const query = searchQuerySchema.parse(firstValues(request.nextUrl.searchParams));
    const result = await catalog.search(query);

    return ApiResponder.ok(result, { headers: ApiResponder.rateLimitHeaders(limit) });
  } catch (error) {
    return ApiResponder.error(error);
  }
}
