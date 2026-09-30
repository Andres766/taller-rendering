import Image from "next/image";
import type { MovieDTO } from "@/application/dto";

type PosterMovie = Pick<MovieDTO, "title" | "palette" | "ageRating" | "releaseYear" | "posterUrl">;

const SIZES = { sm: "120px", md: "(min-width: 1024px) 25vw, 50vw", lg: "(min-width: 768px) 280px, 100vw" } as const;

/**
 * Póster real (TMDB, servido por el optimizador de imágenes de Next.js desde
 * el mismo origen) o, si no hay imagen, un póster generado con CSS.
 */
export function MoviePoster({ movie, size = "md" }: { movie: PosterMovie; size?: "sm" | "md" | "lg" }) {
  const [from, to] = movie.palette;

  return (
    <div
      className={`relative aspect-2/3 w-full overflow-hidden rounded-xl shadow-lg ring-1 ring-white/10 ${size === "lg" ? "mx-auto max-w-xs md:max-w-none" : ""}`}
      style={{ background: `linear-gradient(160deg, ${from} 0%, ${to} 100%)` }}
    >
      {movie.posterUrl ? (
        <Image src={movie.posterUrl} alt={`Póster de ${movie.title}`} fill sizes={SIZES[size]} className="object-cover" />
      ) : (
        <div role="img" aria-label={`Póster de ${movie.title}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_55%)]" />
          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-3">
            <p className={`font-black leading-tight text-white drop-shadow ${size === "sm" ? "text-sm" : "text-xl"}`}>
              {movie.title}
            </p>
            <p className="text-xs text-white/70">{movie.releaseYear}</p>
          </div>
        </div>
      )}
      <div className="absolute right-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
        {movie.ageRating}
      </div>
    </div>
  );
}
