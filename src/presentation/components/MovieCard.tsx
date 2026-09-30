import Link from "next/link";
import type { MovieDTO } from "@/application/dto";
import { fmt } from "../format";
import { MoviePoster } from "./MoviePoster";
import { Stars } from "./Stars";

interface MovieCardProps {
  movie: MovieDTO;
  href?: string;
  footer?: React.ReactNode;
}

export function MovieCard({ movie, href, footer }: MovieCardProps) {
  const body = (
    <>
      <MoviePoster movie={movie} />
      <div className="mt-3 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <Stars value={movie.stars} score={movie.criticRating} />
          {movie.isNewRelease && (
            <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-orange-300">
              Estreno
            </span>
          )}
        </div>
        <p className="text-sm text-zinc-400">
          {movie.director} · {movie.duration}
        </p>
        <p className="text-xs text-zinc-500">{movie.genres.map(fmt.genre).join(" · ")}</p>
      </div>
    </>
  );

  return (
    <article className="group rounded-2xl border border-white/5 bg-zinc-900/60 p-3 transition hover:border-white/15 hover:bg-zinc-900">
      {href ? (
        <Link href={href} className="block focus-visible:outline-none">
          {body}
        </Link>
      ) : (
        body
      )}
      {footer && <div className="mt-3">{footer}</div>}
    </article>
  );
}
