import { ValidationError } from "../errors";
import { Duration } from "../value-objects/Duration";
import { type Genre, parseGenre } from "../value-objects/Genre";
import { Rating } from "../value-objects/Rating";
import { Slug } from "../value-objects/Slug";
import { Entity } from "./Entity";

export const AGE_RATINGS = ["T", "7+", "12+", "15+", "18+", "SC"] as const;
export type AgeRating = (typeof AGE_RATINGS)[number];

export interface MovieProps {
  slug: string;
  title: string;
  synopsis: string;
  director: string;
  genres: string[];
  /** null cuando la fuente aún no publica la duración (estrenos recientes). */
  durationMinutes: number | null;
  releaseDate: string; // ISO yyyy-mm-dd
  /** Calificación de la crítica 0–10, o null si la fuente no la publica (p. ej. iTunes). */
  criticRating: number | null;
  ageRating: AgeRating;
  /** Colores del póster de respaldo generado por CSS (hex), usado si no hay imagen. */
  palette: [string, string];
  /** URL https absoluta del póster, o null. */
  posterUrl?: string | null;
  /** Popularidad relativa según la fuente (>= 0). */
  popularity?: number;
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/**
 * Entidad raíz del catálogo. Se construye solo mediante la fábrica `create`,
 * que valida todas las invariantes; sus atributos no se pueden modificar
 * desde afuera (encapsulamiento).
 */
export class Movie extends Entity<Slug> {
  private constructor(
    slug: Slug,
    private readonly _title: string,
    private readonly _synopsis: string,
    private readonly _director: string,
    private readonly _genres: readonly Genre[],
    private readonly _duration: Duration | null,
    private readonly _releaseDate: Date,
    private readonly _criticRating: Rating | null,
    private readonly _ageRating: AgeRating,
    private readonly _palette: readonly [string, string],
    private readonly _posterUrl: string | null,
    private readonly _popularity: number,
  ) {
    super(slug);
  }

  static create(props: MovieProps): Movie {
    const title = props.title.trim();
    if (title.length < 1 || title.length > 120) {
      throw new ValidationError("El título debe tener entre 1 y 120 caracteres");
    }
    if (props.genres.length === 0) {
      throw new ValidationError("La película debe tener al menos un género");
    }
    const releaseDate = new Date(`${props.releaseDate}T00:00:00Z`);
    if (Number.isNaN(releaseDate.getTime())) {
      throw new ValidationError("Fecha de estreno inválida");
    }
    if (!props.palette.every((c) => HEX_COLOR.test(c))) {
      throw new ValidationError("La paleta debe contener colores hexadecimales");
    }
    if (!(AGE_RATINGS as readonly string[]).includes(props.ageRating)) {
      throw new ValidationError("Clasificación por edad desconocida");
    }
    const popularity = props.popularity ?? 0;
    if (!Number.isFinite(popularity) || popularity < 0) {
      throw new ValidationError("La popularidad debe ser un número no negativo");
    }

    return new Movie(
      Slug.create(props.slug),
      title,
      props.synopsis.trim(),
      props.director.trim(),
      Object.freeze([...new Set(props.genres.map(parseGenre))]),
      props.durationMinutes === null ? null : Duration.ofMinutes(props.durationMinutes),
      releaseDate,
      props.criticRating === null ? null : Rating.of(props.criticRating),
      props.ageRating,
      Object.freeze([props.palette[0], props.palette[1]] as const),
      Movie.validatePosterUrl(props.posterUrl ?? null),
      popularity,
    );
  }

  /** Solo URLs https absolutas: evita `javascript:`, `data:` o rutas relativas manipuladas. */
  private static validatePosterUrl(url: string | null): string | null {
    if (url === null) return null;
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new ValidationError("URL de póster inválida");
    }
    if (parsed.protocol !== "https:") throw new ValidationError("El póster debe servirse por https");
    return parsed.toString();
  }

  get slug(): Slug {
    return this._id;
  }
  get title(): string {
    return this._title;
  }
  get synopsis(): string {
    return this._synopsis;
  }
  get director(): string {
    return this._director;
  }
  get genres(): readonly Genre[] {
    return this._genres;
  }
  get duration(): Duration | null {
    return this._duration;
  }
  get releaseDate(): Date {
    return new Date(this._releaseDate); // copia defensiva: Date es mutable
  }
  get criticRating(): Rating | null {
    return this._criticRating;
  }
  get ageRating(): AgeRating {
    return this._ageRating;
  }
  get palette(): readonly [string, string] {
    return this._palette;
  }
  get posterUrl(): string | null {
    return this._posterUrl;
  }
  get popularity(): number {
    return this._popularity;
  }

  hasGenre(genre: Genre): boolean {
    return this._genres.includes(genre);
  }

  /** Estreno de los últimos 30 días respecto a `now`. */
  isNewRelease(now: Date): boolean {
    const days = (now.getTime() - this._releaseDate.getTime()) / 86_400_000;
    return days >= 0 && days <= 30;
  }

  /** Búsqueda insensible a mayúsculas y tildes sobre título y director. */
  matches(term: string): boolean {
    const needle = normalize(term);
    if (needle.length === 0) return true;
    return normalize(this._title).includes(needle) || normalize(this._director).includes(needle);
  }
}

export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
