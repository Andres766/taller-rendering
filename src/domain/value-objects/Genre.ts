import { ValidationError } from "../errors";

export const GENRES = [
  "accion",
  "aventura",
  "animacion",
  "comedia",
  "crimen",
  "documental",
  "drama",
  "familia",
  "fantasia",
  "historia",
  "terror",
  "musica",
  "misterio",
  "romance",
  "ciencia-ficcion",
  "pelicula-tv",
  "suspenso",
  "belica",
  "western",
  "otros",
] as const;

export type Genre = (typeof GENRES)[number];

export const GENRE_LABELS: Readonly<Record<Genre, string>> = {
  accion: "Acción",
  aventura: "Aventura",
  animacion: "Animación",
  comedia: "Comedia",
  crimen: "Crimen",
  documental: "Documental",
  drama: "Drama",
  familia: "Familia",
  fantasia: "Fantasía",
  historia: "Historia",
  terror: "Terror",
  musica: "Música",
  misterio: "Misterio",
  romance: "Romance",
  "ciencia-ficcion": "Ciencia ficción",
  "pelicula-tv": "Película de TV",
  suspenso: "Suspenso",
  belica: "Bélica",
  western: "Western",
  otros: "Otros",
};

export function isGenre(value: string): value is Genre {
  return (GENRES as readonly string[]).includes(value);
}

export function parseGenre(value: string): Genre {
  if (!isGenre(value)) throw new ValidationError(`Género desconocido: ${value}`);
  return value;
}
