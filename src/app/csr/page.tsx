import type { Metadata } from "next";
import { GENRE_LABELS, GENRES } from "@/domain/value-objects/Genre";
import { SortStrategyRegistry } from "@/application/sorting/MovieSortStrategy";
import { RenderInfo } from "@/presentation/components/RenderInfo";
import { MovieExplorer } from "./MovieExplorer";

/**
 * CSR — Client-Side Rendering.
 * El servidor entrega solo un "cascarón" estático; los resultados los pide y
 * los pinta el navegador (MovieExplorer) consumiendo /api/movies.
 */
export const dynamic = "force-static";

export const metadata: Metadata = { title: "CSR · Buscador" };

export default function CsrPage() {
  const sortOptions = new SortStrategyRegistry().options();
  const genres = GENRES.map((g) => ({ value: g, label: GENRE_LABELS[g] }));

  return (
    <div className="space-y-8">
      <RenderInfo pattern="csr">
        <p>
          El HTML de esta página no contiene películas. Los datos llegan por <code className="font-mono text-xs">fetch</code>{" "}
          y se renderizan en tu navegador (mira la hora en cada resultado).
        </p>
      </RenderInfo>
      <MovieExplorer sortOptions={sortOptions} genres={genres} />
    </div>
  );
}
