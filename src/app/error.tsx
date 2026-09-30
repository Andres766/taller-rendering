"use client";

/**
 * Error Boundary global. Nunca muestra `error.message` al usuario: en
 * producción podría contener detalles internos. Solo se expone el `digest`,
 * un identificador para buscar el error en los logs del servidor.
 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md space-y-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-white">Algo salió mal</h1>
      <p className="text-zinc-400">Ocurrió un error inesperado al mostrar esta página.</p>
      {error.digest && <p className="font-mono text-xs text-zinc-500">Ref: {error.digest}</p>}
      <button type="button" onClick={reset} className="rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-400">
        Reintentar
      </button>
    </div>
  );
}
