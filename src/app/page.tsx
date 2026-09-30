import Link from "next/link";
import { ACCENT_CLASSES, RenderingPatternCatalog } from "@/presentation/catalog/RenderingPatterns";

// La portada no depende de datos: se genera estáticamente (SSG) de forma automática.
export const dynamic = "force-static";

export default function HomePage() {
  const patterns = RenderingPatternCatalog.all();

  return (
    <div className="space-y-12">
      <section className="space-y-4 pt-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-400">Taller · Programación Web</p>
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
          Patrones de <span className="bg-linear-to-r from-orange-400 to-fuchsia-400 bg-clip-text text-transparent">Rendering</span>
        </h1>
        <p className="mx-auto max-w-2xl text-zinc-300">
          <strong className="text-white">CineRender</strong> es una cartelera de cine donde cada sección usa el patrón de
          rendering que mejor se ajusta a sus datos: el catálogo casi nunca cambia, el ranking de popularidad se regenera cada 30 s, las
          sillas disponibles cambian en cada segundo y el buscador vive en el navegador. Las películas son reales:
          el Top de películas de Colombia en iTunes (o la cartelera de TMDB si se configura su token).
        </p>
      </section>

      <section aria-labelledby="patrones" className="space-y-4">
        <h2 id="patrones" className="sr-only">
          Patrones implementados
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {patterns.map((p) => {
            const accent = ACCENT_CLASSES[p.accent];
            return (
              <li key={p.key}>
                <Link
                  href={p.route}
                  className={`flex h-full flex-col rounded-2xl border ${accent.border} bg-zinc-900/60 p-5 transition hover:-translate-y-0.5 hover:bg-zinc-900`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${accent.dot}`} aria-hidden />
                    <span className={`text-xs font-bold tracking-wider ${accent.text}`}>{p.acronym}</span>
                  </div>
                  <h3 className="mt-2 text-lg font-bold text-white">{p.name}</h3>
                  <p className="mt-1 text-sm text-zinc-300">{p.useCase}</p>
                  <p className="mt-3 text-xs text-zinc-400">
                    <span className="font-semibold text-zinc-300">Cuándo: </span>
                    {p.when}
                  </p>
                  <span className={`mt-auto pt-4 text-sm font-semibold ${accent.text}`}>Ver demo →</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="comparativa" className="space-y-4">
        <h2 id="comparativa" className="text-2xl font-bold text-white">
          Comparativa
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-zinc-400">
              <tr>
                <th scope="col" className="px-4 py-3">Patrón</th>
                <th scope="col" className="px-4 py-3">Dónde</th>
                <th scope="col" className="px-4 py-3">Ventajas</th>
                <th scope="col" className="px-4 py-3">Desventajas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {patterns.map((p) => (
                <tr key={p.key} className="align-top">
                  <th scope="row" className={`px-4 py-3 font-bold ${ACCENT_CLASSES[p.accent].text}`}>
                    {p.acronym}
                  </th>
                  <td className="px-4 py-3 text-zinc-300">{p.where}</td>
                  <td className="px-4 py-3 text-zinc-300">{p.pros.join(" · ")}</td>
                  <td className="px-4 py-3 text-zinc-400">{p.cons.join(" · ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
