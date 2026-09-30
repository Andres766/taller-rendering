/**
 * loading.tsx: Next.js envuelve la página en un <Suspense> con este fallback,
 * así que durante la navegación se muestra al instante (streaming a nivel de ruta).
 */
export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando">
      <div className="h-48 animate-pulse rounded-2xl bg-rose-400/10" />
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <div className="h-80 animate-pulse rounded-xl bg-white/5" />
        <div className="space-y-3">
          <div className="h-8 w-2/3 animate-pulse rounded bg-white/5" />
          <div className="h-24 animate-pulse rounded bg-white/5" />
        </div>
      </div>
    </div>
  );
}
