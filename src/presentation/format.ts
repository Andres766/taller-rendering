import { GENRE_LABELS, type Genre } from "@/domain/value-objects/Genre";

const TIME_ZONE = "America/Bogota";

const timeFmt = new Intl.DateTimeFormat("es-CO", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const shortTimeFmt = new Intl.DateTimeFormat("es-CO", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

const dateFmt = new Intl.DateTimeFormat("es-CO", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** Formatos siempre en hora de Colombia, iguales en servidor y navegador. */
export const fmt = {
  clock: (d: Date | string) => timeFmt.format(new Date(d)),
  showtime: (d: Date | string) => shortTimeFmt.format(new Date(d)),
  date: (d: Date | string) => dateFmt.format(new Date(d)),
  genre: (g: Genre) => GENRE_LABELS[g],
};
