import type { AgeRating, MovieProps } from "@/domain/entities/Movie";
import { normalize } from "@/domain/entities/Movie";
import type { ReviewProps } from "@/domain/entities/Review";
import type { Genre } from "@/domain/value-objects/Genre";
import { pseudoRandom } from "../util/pseudoRandom";
import { slugWithId } from "../util/slugify";
import type { ItunesLookupItem, ItunesReviewsFeed } from "./schemas";

/** Palabras clave de las categorías en español de iTunes → géneros del dominio. */
const GENRE_KEYWORDS: readonly [string, Genre][] = [
  ["accion", "accion"],
  ["aventura", "aventura"],
  ["ciencia ficcion", "ciencia-ficcion"],
  ["fantasia", "fantasia"],
  ["comedia", "comedia"],
  ["terror", "terror"],
  ["horror", "terror"],
  ["drama", "drama"],
  ["familia", "familia"],
  ["infantil", "familia"],
  ["animacion", "animacion"],
  ["anime", "animacion"],
  ["suspenso", "suspenso"],
  ["thriller", "suspenso"],
  ["romance", "romance"],
  ["romantic", "romance"],
  ["documental", "documental"],
  ["music", "musica"],
  ["western", "western"],
  ["crimen", "crimen"],
  ["policia", "crimen"],
  ["historia", "historia"],
  ["guerra", "belica"],
  ["misterio", "misterio"],
];

const AGE_RATINGS: Readonly<Record<string, AgeRating>> = {
  todos: "T",
  t: "T",
  "7": "7+",
  "12": "12+",
  "15": "15+",
  "18": "18+",
};

const ARTWORK_SIZE = /\/\d+x\d+bb\.(jpg|png)$/;

/** Capa anticorrupción: modelo de iTunes → modelo del dominio. */
export class ItunesMapper {
  /** `rank` es la posición en el Top (0 = la más vendida); se convierte en popularidad. */
  toMovieProps(item: ItunesLookupItem, rank: number, total: number): MovieProps | null {
    const releaseDate = item.releaseDate?.slice(0, 10) ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(releaseDate)) return null;

    const title = truncate(item.trackName.trim(), 120);
    const minutes = item.trackTimeMillis ? Math.round(item.trackTimeMillis / 60_000) : null;

    return {
      slug: slugWithId(item.trackId, title),
      title,
      synopsis: truncate((item.longDescription ?? item.shortDescription ?? "").trim(), 1500) || "Sinopsis no disponible.",
      director: truncate(item.artistName?.trim() || "Por confirmar", 120),
      genres: this.genres(item.primaryGenreName ?? ""),
      durationMinutes: minutes && minutes > 0 && minutes <= 600 ? minutes : null,
      releaseDate,
      criticRating: null, // iTunes no publica calificación de la crítica
      ageRating: AGE_RATINGS[normalize(item.contentAdvisoryRating ?? "")] ?? "SC",
      palette: paletteFor(item.trackId),
      posterUrl: this.posterUrl(item.artworkUrl100),
      popularity: Math.max(0, total - rank),
    };
  }

  toReviewProps(movieSlug: string, feed: ItunesReviewsFeed, limit: number): ReviewProps[] {
    return feed.feed.entry.slice(0, limit).map((e) => {
      const stars = Number(e["im:rating"]?.label);
      const title = e.title?.label.trim();
      const body = e.content?.label.replace(/\s+/g, " ").trim() ?? "";
      const updated = e.updated?.label ?? "";
      return {
        id: `itunes-${e.id.label}`.slice(0, 80),
        movieSlug,
        author: truncate(e.author.name.label.trim() || "Anónimo", 60),
        rating: Number.isInteger(stars) && stars >= 1 && stars <= 5 ? stars * 2 : null, // 1–5 estrellas → 0–10
        comment: truncate([title, body].filter(Boolean).join(" — ") || "(sin texto)", 500),
        createdAt: Number.isNaN(Date.parse(updated)) ? new Date(0).toISOString() : new Date(updated).toISOString(),
      };
    });
  }

  private genres(category: string): Genre[] {
    const text = normalize(category);
    const found = GENRE_KEYWORDS.filter(([keyword]) => text.includes(keyword)).map(([, genre]) => genre);
    return found.length > 0 ? [...new Set(found)] : ["otros"];
  }

  /** Solo imágenes https del CDN de Apple; se pide la versión de 600×900 (proporción de póster). */
  private posterUrl(artwork: string | null | undefined): string | null {
    if (!artwork) return null;
    try {
      const url = new URL(artwork);
      if (url.protocol !== "https:" || !url.hostname.endsWith(".mzstatic.com") || !ARTWORK_SIZE.test(url.pathname)) {
        return null;
      }
      url.pathname = url.pathname.replace(ARTWORK_SIZE, "/600x900bb.jpg");
      url.search = "";
      return url.toString();
    } catch {
      return null;
    }
  }
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

function paletteFor(id: number): [string, string] {
  const hue = Math.floor(pseudoRandom(String(id)) * 360);
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
