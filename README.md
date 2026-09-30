# 🎬 CineRender — Taller Patrones de Rendering

Cartelera de cine con **las películas reales en cartelera en Colombia (API de TMDB)**, donde **cada sección usa el
patrón de rendering que mejor se ajusta a sus datos**.
Construida con **Next.js 16 (App Router) + TypeScript + Tailwind CSS**, con dominio orientado a objetos,
arquitectura por capas, pruebas unitarias y medidas de seguridad. Lista para desplegar en **Vercel**.

## Patrones implementados

| Ruta | Patrón | Caso de estudio | Cómo se logra en Next.js |
|---|---|---|---|
| `/ssg` | **SSG** — Static Site Generation | Catálogo completo (casi nunca cambia) | `export const dynamic = "force-static"` |
| `/isr`, `/isr/[slug]` | **ISR** — Incremental Static Regeneration | Ranking de popularidad y ficha de película | `export const revalidate = 30` + `generateStaticParams` + `POST /api/revalidate` |
| `/ssr` | **SSR** — Server-Side Rendering | Funciones del día y sillas disponibles (simuladas) | `export const dynamic = "force-dynamic"` + `searchParams` |
| `/csr` | **CSR** — Client-Side Rendering | Buscador con filtros y favoritos | `"use client"` + `fetch` a `GET /api/movies` |
| `/streaming` | **Streaming SSR** | Ficha de estreno cuyas secciones llegan a los 1 s, 2,2 s y 3,5 s | `<Suspense>` + `loading.tsx` + componentes `async` |
| `/islas` | **RSC + islas** (hidratación parcial) | Lista 100 % servidor con botones interactivos aislados | Server Components por defecto + `"use client"` solo en las hojas |

Cada página muestra un panel con **evidencia**: la hora en que se generó el HTML comparada con la hora de tu
navegador. Así se ve la diferencia entre patrones:

- **SSG**: la hora es la del build y no cambia al recargar.
- **ISR**: la hora solo cambia cuando pasaron más de 30 s (stale-while-revalidate).
- **SSR**: cambia en cada recarga, y la ocupación de las sillas también.
- **CSR**: `Ctrl+U` muestra un HTML sin películas; los resultados los pinta el navegador.
- **Streaming**: cada sección muestra la hora a la que llegó.

La salida de `next build` también lo confirma: `○` estático, `●` SSG con `generateStaticParams`, `Revalidate 30s` en ISR y `ƒ` dinámico.

## Fuentes de datos (reales)

La fuente se elige con `CATALOG_SOURCE` (por defecto `auto`):

| Fuente | Cuándo | Qué aporta |
|---|---|---|
| **iTunes Store** (API pública de Apple, **sin clave**) | Por defecto | Top de películas de Colombia en español, con póster, director, duración, género, clasificación, sinopsis y **reseñas reales de usuarios colombianos**. La posición en el Top define la popularidad. No publica calificación de la crítica. |
| **TMDB** | Si defines `TMDB_API_TOKEN` | Películas **en cartelera de cines** en Colombia, calificación, popularidad y reseñas. |
| **Demo** | `CATALOG_SOURCE=demo` | Catálogo ficticio en memoria; sirve para trabajar sin red. |

Las **funciones y sillas** son simuladas sobre el catálogo real, porque no existe una API pública de los cines colombianos. El pie de página muestra la fuente activa.

- El cambio de fuente ocurre solo en el Composition Root (`createDataSource()` en `container.ts`). Servicios y páginas no se enteran, porque todos los adaptadores implementan `MovieRepository` y `ReviewRepository`.
- `TmdbClient` e `ItunesClient` heredan de `HttpJsonClient` (Template Method), que aporta tiempo límite, reintentos y validación Zod. Las subclases solo cambian la autenticación y qué respuestas se reintentan: iTunes devuelve 403 cuando se excede su límite de unas 20 solicitudes por minuto.
- Las solicitudes a iTunes **no usan la caché de `fetch` de Next.js** a propósito: un `next.revalidate` convertiría las páginas SSG en ISR. La cuota se protege con el decorador `CachingMovieRepository` (TTL de 15 min y *single-flight*), que además resuelve `findBySlug` desde el catálogo cacheado. Todo el catálogo de iTunes se obtiene con **2 solicitudes** (feed + un `/lookup`).
- Si la fuente falla durante una regeneración ISR, el error se propaga y Next.js **conserva la última versión buena** de la página.

## Arquitectura

Arquitectura limpia / hexagonal en cuatro capas. Las dependencias apuntan **hacia adentro**: el dominio no conoce Next.js.

```
src/
├── domain/            ← Reglas de negocio puras (sin frameworks)
│   ├── entities/        Entity (abstracta), Movie, Showtime, Review
│   ├── value-objects/   Slug, Rating, Duration, Genre
│   ├── repositories/    Interfaces (puertos): MovieRepository, ShowtimeRepository, ReviewRepository, Clock
│   ├── services/        TrendingCalculator (servicio de dominio)
│   └── errors.ts        Jerarquía DomainError → ValidationError, NotFoundError, …
├── application/       ← Casos de uso
│   ├── services/        MovieCatalogService, ShowtimeService, ReviewService
│   ├── sorting/         Estrategias de ordenamiento (Strategy + Registry)
│   ├── mappers/         Entidad → DTO (Data Mapper)
│   ├── dto/             Objetos planos serializables hacia el cliente
│   └── validation/      Esquemas Zod (listas blancas para toda entrada externa)
├── infrastructure/    ← Adaptadores concretos
│   ├── http/            HttpJsonClient (clase base abstracta: timeout, reintentos, validación)
│   ├── itunes/          ItunesClient, ItunesMapper, esquemas Zod, repositorios iTunes
│   ├── tmdb/            TmdbClient, TmdbMapper (capa anticorrupción), esquemas Zod, repositorios TMDB
│   ├── repositories/    InMemory*, SimulatedShowtimeRepository, LatencyDecorators, CachingDecorators
│   ├── cache/           TtlCache (TTL + single-flight)
│   ├── security/        TokenBucketRateLimiter, SecretVerifier
│   ├── config/env.ts    Variables de entorno validadas (server-only)
│   └── container.ts     Composition Root (inyección de dependencias)
├── presentation/      ← UI reutilizable
│   ├── components/      RenderInfo, MovieCard, MoviePoster, NavLinks, LiveClock…
│   ├── hooks/           useNow, useFavorites, useMovieSearch
│   ├── api/             MovieApiClient (Gateway HTTP del navegador)
│   └── http/            ApiResponder (errores → HTTP)
└── app/               ← Rutas de Next.js (una carpeta por patrón)
```

### Principios de POO aplicados

- **Encapsulamiento**: constructores privados, atributos `private readonly`, getters y copias defensivas (`Date`).
- **Invariantes**: toda entidad y value object se crea con una fábrica estática (`Movie.create`, `Slug.create`) que valida los datos; un objeto inválido no puede existir.
- **Herencia y abstracción**: `Entity<TId>` (igualdad por identidad), `DomainError`, `LatencyDecorator<TRepo>`.
- **Polimorfismo**: estrategias de ordenamiento intercambiables e implementaciones de repositorio intercambiables.
- **SOLID**: SRP por capa, Open/Closed en estrategias, Liskov en repositorios/decoradores, interfaces pequeñas e **inversión de dependencias** (los servicios reciben interfaces por constructor).

### Patrones de diseño

| Patrón | Dónde |
|---|---|
| Repository | `domain/repositories` + `infrastructure/repositories` |
| Dependency Injection / Composition Root | `infrastructure/container.ts` |
| Singleton | `container()` (por proceso), stores de cliente |
| Factory Method | `Movie.create`, `Rating.of`, `Duration.ofMinutes` |
| Value Object | `Slug`, `Rating`, `Duration` |
| Strategy + Registry | `MovieSortStrategy`, `SortStrategyRegistry` |
| Decorator | Latencia (`Latency*Repository`) y caché (`CachingMovieRepository`, `CachingReviewRepository`) |
| Adapter / capa anticorrupción | `Itunes*Repository` + `ItunesMapper`, `Tmdb*Repository` + `TmdbMapper` |
| Template Method | `HttpJsonClient` → `TmdbClient`, `ItunesClient` |
| Factory (fuente de datos) | `createDataSource()` en `container.ts`: iTunes, TMDB o demo según el entorno |
| Data Mapper / DTO | `application/mappers`, `application/dto` |
| Gateway | `ItunesClient` / `TmdbClient` (servidor → API externa) y `MovieApiClient` (navegador → API propia) |
| Observer | `TickerStore` (`useNow`) y `FavoritesStore` con `useSyncExternalStore` |

## Seguridad

- **La API externa también es entrada no confiable**:
  - Las respuestas de TMDB se validan con Zod.
  - Las rutas de pósters se filtran con una expresión regular.
  - Los textos se recortan antes de llegar al dominio.
  - El token viaja en el encabezado `Authorization` (nunca en la URL).
  - Cada solicitud tiene un tiempo límite de 8 s y reintentos con espera ante 429.
- **Optimizador de imágenes con lista blanca**: `remotePatterns` solo acepta `*.mzstatic.com/image/thumb/**` (Apple) e `image.tmdb.org/t/p/**`, así el endpoint de imágenes no sirve de proxy abierto (SSRF). Como las imágenes se sirven desde el mismo origen, la CSP mantiene `img-src 'self'`.
- **Validación con listas blancas (Zod)** en query strings, parámetros de ruta y cuerpos JSON. Los slugs admiten solo `[a-z0-9-]`, lo que bloquea path traversal.
- **Cabeceras HTTP**: CSP, `X-Frame-Options: DENY`, `nosniff`, HSTS, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP y `poweredByHeader: false`.
  - La CSP es estática a propósito: una CSP con *nonce* obliga a renderizar todas las páginas por solicitud y anularía SSG e ISR. Por eso se permite `'unsafe-inline'` en scripts (Next.js inyecta scripts de hidratación) y todo lo demás queda restringido a `'self'`.
- **Rate limiting** con Token Bucket en la API (`429` + `Retry-After`) y memoria acotada para resistir IPs rotativas.
- **Revalidación protegida**: `POST /api/revalidate` exige `Bearer <REVALIDATE_SECRET>` y compara en **tiempo constante** (`timingSafeEqual` sobre hashes SHA-256). Además tiene un rate limit estricto (5 intentos) y un cuerpo limitado a 1 KB.
- **ISR acotado a la cartelera**: `dynamicParams = true` permite fichas para estrenos posteriores al build, pero solo se renderizan slugs **canónicos** que pertenecen a la cartelera actual. Cualquier otro devuelve 404, lo que evita que un atacante llene la caché pidiendo IDs de TMDB.
- **`server-only`** en el contenedor, la configuración y `ApiResponder`: el build falla si un Client Component intenta importarlos, así los secretos nunca llegan al navegador.
- **Errores sin fugas**: la API devuelve mensajes genéricos y `error.tsx` solo muestra el `digest`.
- **XSS**: no se usa `dangerouslySetInnerHTML`. Los colores de los pósters que van en `style` se validan como hexadecimales en el dominio, y lo que se lee de `localStorage` se valida como entrada no confiable.
- **Secretos por variables de entorno** validadas al arrancar (`.env*` está en `.gitignore`; solo se versiona `.env.example`).

## Ejecutar en local

```bash
npm install
cp .env.example .env.local   # opcional: sin cambios usa iTunes; agrega TMDB_API_TOKEN o REVALIDATE_SECRET
npm run dev                  # http://localhost:3000
```

> En `next dev` todas las páginas se renderizan en cada solicitud. Para ver SSG e ISR de verdad usa el modo producción:

```bash
npm run build && npm start
```

Scripts: `npm test` (53 pruebas con Vitest; las de iTunes y TMDB usan un `fetch` falso inyectado, sin red), `npm run typecheck` y `npm run lint`.

## Despliegue en la nube (Vercel)

1. Sube el repositorio a GitHub.
2. En [vercel.com/new](https://vercel.com/new) importa el repositorio (Vercel detecta Next.js automáticamente).
3. En **Settings → Environment Variables** agrega `REVALIDATE_SECRET` (64 caracteres hexadecimales aleatorios) y, si quieres usar TMDB, `TMDB_API_TOKEN`.
4. Despliega. También puedes hacerlo por CLI: `npx vercel login` y luego `npx vercel --prod`.

Probar la revalidación bajo demanda en producción:

```bash
curl -X POST https://<tu-dominio>/api/revalidate \
  -H "Authorization: Bearer $REVALIDATE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"slug":"<slug-de-la-pelicula>"}'
```

> El rate limiter guarda su estado en memoria, por instancia. En un despliegue con muchas instancias se reemplazaría por una implementación sobre Redis (por ejemplo Upstash) que cumpla la misma interfaz `RateLimiter`, sin tocar el resto del código.
