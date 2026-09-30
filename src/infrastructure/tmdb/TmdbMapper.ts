import type { AgeRating, MovieProps } from "@/domain/entities/Movie";
import type { ReviewProps } from "@/domain/entities/Review";
import type { Genre } from "@/domain/value-objects/Genre";
import { slugWithId } from "../util/slugify";
import type { TmdbMovieDetails, TmdbReviews } from "./schemas";

/** Códigos de género oficiales de TMDB → géneros del dominio. */
const GENRE_BY_TMDB_ID: Readonly<Record<number, Genre>> = {
  28: "accion",
  12: "aventura",
  16: "animacion",
  35: "comedia",
  80: "crimen",
  99: "documental",
  18: "drama",
  10751: "familia",
  14: "fantasia",
  36: "historia",
  27: "terror",
  10402: "musica",
  9648: "misterio",
  10749: "romance",
  878: "ciencia-ficcion",
  10770: "pelicula-tv",
  53: "suspenso",
  10752: "belica",
  37: "western",
};

/** Clasificaciones de Colombia y EE. UU. → clasificación del dominio. */
const CERTIFICATIONS: Readonly<Record<string, AgeRating>> = {
  T: "T",
  G: "T",
  "7": "7+",
  PG: "7+",
  "12": "12+",
  "PG-13": "12+",
  "15": "15+",
  "18": "18+",
  R: "18+",
  "NC-17": "18+",
};

const POSTER_PATH = /^\/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

/**
 * Capa anticorrupción: traduce el modelo de TMDB al modelo del dominio.
 * Si mañana cambia la API externa, solo cambia este archivo.
 */
export class TmdbMapper {
  constructor(private readonly region: string) {}

  /** Devuelve null si a la película le faltan datos imprescindibles. */
  toMovieProps(d: TmdbMovieDetails): MovieProps | null {
    const genres = d.genres.map((g) => GENRE_BY_TMDB_ID[g.id]).filter((g): g is Genre => g !== undefined);
    if (genres.length === 0 || !ISO_DATE.test(d.release_date)) return null;

    const title = truncate(d.title.trim() || `Película ${d.id}`, 120);
    const directors = (d.credits?.crew ?? []).filter((c) => c.job === "Director").map((c) => c.name);

    return {
      slug: TmdbMapper.slugFor(d.id, title),
      title,
      synopsis: d.overview.trim() || "Sinopsis no disponible en español.",
      director: truncate(directors.slice(0, 2).join(", ") || "Por confirmar", 120),
      genres,
      durationMinutes: d.runtime && d.runtime > 0 && d.runtime <= 600 ? d.runtime : null,
      releaseDate: d.release_date,
      criticRating: clamp(d.vote_average, 0, 10),
      ageRating: this.ageRating(d),
      palette: paletteFor(d.id),
      posterUrl: d.poster_path && POSTER_PATH.test(d.poster_path) ? IMAGE_BASE + d.poster_path : null,
      popularity: d.popularity,
    };
  }

  toReviewProps(movieSlug: string, reviews: TmdbReviews, limit: number): ReviewProps[] {
    return reviews.results.slice(0, limit).map((r) => ({
      id: `tmdb-${r.id}`.slice(0, 80),
      movieSlug,
      author: truncate(r.author.trim() || "Anónimo", 60),
      rating: typeof r.author_details?.rating === "number" ? clamp(r.author_details.rating, 0, 10) : null,
      // Se colapsan espacios y se recorta; React escapa el texto al renderizar (sin riesgo de XSS).
      comment: truncate(r.content.replace(/\s+/g, " ").trim() || "(sin texto)", 500),
      createdAt: Number.isNaN(Date.parse(r.created_at)) ? new Date(0).toISOString() : r.created_at,
    }));
  }

  /** Slug canónico: "<id>-<titulo-normalizado>", p. ej. "1061474-superman". */
  static slugFor(id: number, title: string): string {
    return slugWithId(id, title);
  }

  /** Extrae el id numérico de TMDB desde el slug. */
  static idFromSlug(slug: string): number | null {
    const match = /^(\d{1,10})(?:-|$)/.exec(slug);
    return match ? Number(match[1]) : null;
  }

  private ageRating(d: TmdbMovieDetails): AgeRating {
    const results = d.release_dates?.results ?? [];
    for (const country of [this.region, "US"]) {
      const entry = results.find((r) => r.iso_3166_1 === country);
      const cert = entry?.release_dates.map((x) => x.certification?.trim()).find((c) => c && CERTIFICATIONS[c]);
      if (cert) return CERTIFICATIONS[cert];
    }
    return "SC";
  }
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Paleta determinista por id para el póster de respaldo. */
function paletteFor(id: number): [string, string] {
  const hue = (id * 47) % 360;
  return [hslToHex(hue, 70, 45), hslToHex((hue + 30) % 360, 60, 12)];
}

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const light = l / 100;
  const a = sat * Math.min(light, 1 - light);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(color * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}
