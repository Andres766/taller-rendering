import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { RenderingPatternCatalog } from "@/presentation/catalog/RenderingPatterns";
import { container } from "@/infrastructure/container";
import { NavLinks } from "@/presentation/components/NavLinks";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "CineRender · Patrones de Rendering", template: "%s · CineRender" },
  description:
    "Cartelera de cine que implementa SSG, ISR, SSR, CSR, Streaming y React Server Components con islas. Taller de Programación Web.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const patterns = RenderingPatternCatalog.all().map(({ key, acronym, route }) => ({ key, acronym, route }));
  const { dataSource } = container();

  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-black"
        >
          Saltar al contenido
        </a>
        <header className="sticky top-0 z-40 border-b border-white/5 bg-zinc-950/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="flex items-center gap-2 text-lg font-black tracking-tight text-white">
              <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-orange-500 text-sm">
                🎬
              </span>
              Cine<span className="text-orange-400">Render</span>
            </Link>
            <NavLinks patterns={patterns} />
          </div>
        </header>

        <main id="contenido" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          {children}
        </main>

        <footer className="space-y-1 border-t border-white/5 px-4 py-6 text-center text-xs text-zinc-500">
          <p>
            Taller Patrones de Rendering · Programación Web · Fuente de datos:{" "}
            <span className={dataSource.kind === "demo" ? "text-amber-400" : "text-emerald-400"}>{dataSource.label}</span>
          </p>
          {dataSource.kind === "tmdb" && (
            <p>
              Datos e imágenes de{" "}
              <a href="https://www.themoviedb.org" className="underline hover:text-zinc-300" rel="noopener noreferrer" target="_blank">
                TMDB
              </a>
              . Este producto usa la API de TMDB, pero TMDB no lo avala ni lo certifica.
            </p>
          )}
          {dataSource.kind === "itunes" && (
            <p>Catálogo, pósters y reseñas de la tienda de iTunes de Apple (API pública). Marcas y pósters pertenecen a sus titulares.</p>
          )}
          <p>Las funciones y la disponibilidad de sillas son simuladas.</p>
        </footer>
      </body>
    </html>
  );
}
