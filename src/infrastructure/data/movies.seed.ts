import type { MovieProps } from "@/domain/entities/Movie";

/**
 * Catálogo ficticio de respaldo ("modo demo"): se usa cuando no hay
 * TMDB_API_TOKEN configurado, para que la app funcione sin credenciales.
 */
export const MOVIES_SEED: readonly MovieProps[] = [
  {
    slug: "el-ultimo-tren-a-ipiales",
    title: "El último tren a Ipiales",
    synopsis:
      "Un maquinista a punto de jubilarse emprende el último viaje de una línea férrea olvidada, acompañado por pasajeros que guardan secretos del pasado.",
    director: "Lucía Benavides",
    genres: ["drama", "aventura"],
    durationMinutes: 118,
    releaseDate: "2026-09-12",
    criticRating: 8.7,
    ageRating: "12+",
    palette: ["#f97316", "#7c2d12"],
    popularity: 180,
  },
  {
    slug: "orbita-galeras",
    title: "Órbita Galeras",
    synopsis:
      "En 2090 una estación científica sobre el volcán Galeras detecta una señal que podría cambiar la historia de la humanidad.",
    director: "Mateo Rosero",
    genres: ["ciencia-ficcion", "suspenso"],
    durationMinutes: 134,
    releaseDate: "2026-08-28",
    criticRating: 8.1,
    ageRating: "12+",
    palette: ["#6366f1", "#0f172a"],
    popularity: 240,
  },
  {
    slug: "cuy-y-el-carnaval",
    title: "Cuy y el Carnaval",
    synopsis:
      "Un pequeño cuy sueña con desfilar en el Carnaval de Negros y Blancos y deberá construir su propia carroza con ayuda de sus amigos.",
    director: "Ana Pantoja",
    genres: ["animacion", "comedia", "aventura"],
    durationMinutes: 92,
    releaseDate: "2026-07-18",
    criticRating: 7.9,
    ageRating: "T",
    palette: ["#facc15", "#be185d"],
    popularity: 150,
  },
  {
    slug: "niebla-en-la-cocha",
    title: "Niebla en La Cocha",
    synopsis:
      "Una detective investiga desapariciones en la laguna de La Cocha, donde la niebla parece borrar los recuerdos de los testigos.",
    director: "Javier Erazo",
    genres: ["suspenso", "drama"],
    durationMinutes: 107,
    releaseDate: "2026-05-02",
    criticRating: 7.4,
    ageRating: "15+",
    palette: ["#94a3b8", "#1e293b"],
    popularity: 60,
  },
  {
    slug: "manos-de-barniz",
    title: "Manos de Barniz",
    synopsis:
      "Documental sobre los últimos maestros del barniz de Pasto (mopa-mopa), una técnica ancestral reconocida como patrimonio de la humanidad.",
    director: "Carolina Muñoz",
    genres: ["documental"],
    durationMinutes: 78,
    releaseDate: "2026-03-20",
    criticRating: 9.1,
    ageRating: "T",
    palette: ["#16a34a", "#422006"],
    popularity: 35,
  },
  {
    slug: "algoritmo-de-amor",
    title: "Algoritmo de amor",
    synopsis:
      "Dos programadores rivales descubren que la app de citas que construyen juntos los emparejó entre sí… y el código no miente.",
    director: "Sebastián Ortiz",
    genres: ["comedia"],
    durationMinutes: 101,
    releaseDate: "2026-09-19",
    criticRating: 6.8,
    ageRating: "12+",
    palette: ["#ec4899", "#4c0519"],
    popularity: 120,
  },
  {
    slug: "cumbre-azufral",
    title: "Cumbre Azufral",
    synopsis:
      "Un grupo de montañistas queda atrapado en el volcán Azufral y debe cruzar la laguna verde antes de que llegue la tormenta.",
    director: "Diana Guerrero",
    genres: ["aventura", "suspenso"],
    durationMinutes: 112,
    releaseDate: "2025-12-05",
    criticRating: 7.2,
    ageRating: "12+",
    palette: ["#10b981", "#064e3b"],
    popularity: 45,
  },
  {
    slug: "memoria-de-silicio",
    title: "Memoria de silicio",
    synopsis:
      "Una inteligencia artificial encargada de restaurar películas antiguas empieza a reescribir sus finales, y el mundo prefiere las nuevas versiones.",
    director: "Tomás Villota",
    genres: ["ciencia-ficcion", "drama"],
    durationMinutes: 126,
    releaseDate: "2026-06-13",
    criticRating: 8.4,
    ageRating: "15+",
    palette: ["#06b6d4", "#172554"],
    popularity: 95,
  },
];
