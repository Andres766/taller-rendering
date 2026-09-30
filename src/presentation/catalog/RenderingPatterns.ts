export type PatternKey = "ssg" | "isr" | "ssr" | "csr" | "streaming" | "islas";

export interface RenderingPatternInfo {
  key: PatternKey;
  acronym: string;
  name: string;
  route: string;
  useCase: string;
  when: string;
  where: string;
  howInNext: string;
  pros: string[];
  cons: string[];
  howToVerify: string;
  accent: string; // clase de color de Tailwind (texto/borde)
}

/**
 * Catálogo de los patrones de rendering implementados. Es la única fuente de
 * verdad para la portada, la navegación y el panel explicativo de cada página.
 */
export class RenderingPatternCatalog {
  private static readonly PATTERNS: readonly RenderingPatternInfo[] = [
    {
      key: "ssg",
      acronym: "SSG",
      name: "Static Site Generation",
      route: "/ssg",
      useCase: "Catálogo completo de películas",
      when: "Una sola vez, durante el build (`next build`).",
      where: "Servidor de build → CDN",
      howInNext: "export const dynamic = 'force-static'",
      pros: ["Respuesta instantánea desde el CDN", "Costo de servidor casi nulo", "Excelente SEO"],
      cons: ["Los datos quedan congelados hasta el siguiente despliegue"],
      howToVerify: "La hora de generación no cambia al recargar: es la hora del build.",
      accent: "emerald",
    },
    {
      key: "isr",
      acronym: "ISR",
      name: "Incremental Static Regeneration",
      route: "/isr",
      useCase: "Ranking de popularidad y ficha de cada película",
      when: "En el build y luego, en segundo plano, como máximo cada 30 s.",
      where: "Servidor (regeneración) → CDN",
      howInNext: "export const revalidate = 30 + generateStaticParams()",
      pros: ["Velocidad de una página estática", "Contenido que se actualiza sin redeploy", "Revalidación bajo demanda vía webhook"],
      cons: ["El primer visitante tras el vencimiento ve la versión anterior (stale-while-revalidate)"],
      howToVerify: "Recarga varias veces: la hora solo cambia cuando pasan más de 30 s. Los datos de TMDB se cachean 1 h.",
      accent: "amber",
    },
    {
      key: "ssr",
      acronym: "SSR",
      name: "Server-Side Rendering",
      route: "/ssr",
      useCase: "Funciones del día y sillas disponibles en tiempo real (simuladas)",
      when: "En cada solicitud.",
      where: "Servidor (función serverless)",
      howInNext: "export const dynamic = 'force-dynamic' + searchParams",
      pros: ["Datos siempre frescos", "Puede personalizar por solicitud (ciudad, cookies)", "HTML completo para SEO"],
      cons: ["Mayor latencia (TTFB) y costo por visita", "No se cachea en el CDN"],
      howToVerify: "Cada recarga muestra una hora distinta y la ocupación de las sillas cambia.",
      accent: "sky",
    },
    {
      key: "csr",
      acronym: "CSR",
      name: "Client-Side Rendering",
      route: "/csr",
      useCase: "Buscador interactivo con filtros y favoritos",
      when: "En el navegador, después de cargar el JavaScript.",
      where: "Navegador del usuario (fetch a /api/movies)",
      howInNext: "'use client' + useEffect/fetch a un Route Handler",
      pros: ["Interacción muy fluida sin recargar", "Descarga trabajo del servidor", "Estado local (favoritos)"],
      cons: ["El HTML inicial llega vacío (peor SEO)", "Depende del JavaScript y del dispositivo"],
      howToVerify: "Ver código fuente (Ctrl+U): los resultados no están en el HTML.",
      accent: "violet",
    },
    {
      key: "streaming",
      acronym: "Streaming",
      name: "Streaming SSR con Suspense",
      route: "/streaming",
      useCase: "Ficha de estreno cuyas secciones llegan por partes",
      when: "En cada solicitud, enviando el HTML por fragmentos.",
      where: "Servidor → navegador progresivamente",
      howInNext: "<Suspense fallback> + loading.tsx + componentes async",
      pros: ["El usuario ve contenido de inmediato (mejor FCP)", "Las partes lentas no bloquean a las rápidas"],
      cons: ["Requiere diseñar estados de carga", "El status HTTP ya se envió al empezar el stream"],
      howToVerify: "Observa cómo cada sección aparece en momentos distintos con su propia hora.",
      accent: "rose",
    },
    {
      key: "islas",
      acronym: "RSC + Islas",
      name: "React Server Components + islas de cliente",
      route: "/islas",
      useCase: "Cartelera estática con botones interactivos aislados",
      when: "HTML en build; solo las islas se hidratan en el navegador.",
      where: "Servidor (0 KB de JS por la lista) + navegador (islas)",
      howInNext: "Server Component por defecto + 'use client' solo en las hojas interactivas",
      pros: ["Mucho menos JavaScript enviado", "Interactividad justo donde se necesita"],
      cons: ["Hay que pensar bien la frontera servidor/cliente", "Solo datos serializables cruzan la frontera"],
      howToVerify: "Solo los botones ♥ y 'Ver tráiler' reaccionan; el resto es HTML sin hidratar.",
      accent: "teal",
    },
  ];

  static all(): readonly RenderingPatternInfo[] {
    return RenderingPatternCatalog.PATTERNS;
  }

  static get(key: PatternKey): RenderingPatternInfo {
    const found = RenderingPatternCatalog.PATTERNS.find((p) => p.key === key);
    if (!found) throw new Error(`Patrón desconocido: ${key}`);
    return found;
  }
}

/** Clases completas de Tailwind (deben ser literales para que el compilador las detecte). */
export const ACCENT_CLASSES: Record<string, { text: string; border: string; bg: string; dot: string }> = {
  emerald: { text: "text-emerald-300", border: "border-emerald-400/40", bg: "bg-emerald-400/10", dot: "bg-emerald-400" },
  amber: { text: "text-amber-300", border: "border-amber-400/40", bg: "bg-amber-400/10", dot: "bg-amber-400" },
  sky: { text: "text-sky-300", border: "border-sky-400/40", bg: "bg-sky-400/10", dot: "bg-sky-400" },
  violet: { text: "text-violet-300", border: "border-violet-400/40", bg: "bg-violet-400/10", dot: "bg-violet-400" },
  rose: { text: "text-rose-300", border: "border-rose-400/40", bg: "bg-rose-400/10", dot: "bg-rose-400" },
  teal: { text: "text-teal-300", border: "border-teal-400/40", bg: "bg-teal-400/10", dot: "bg-teal-400" },
};
