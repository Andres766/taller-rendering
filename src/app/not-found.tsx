import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md space-y-4 py-20 text-center">
      <p className="text-6xl font-black text-orange-400">404</p>
      <h1 className="text-2xl font-bold text-white">Esta función no está en cartelera</h1>
      <p className="text-zinc-400">La página que buscas no existe o fue retirada.</p>
      <Link href="/" className="inline-block rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-400">
        Volver al inicio
      </Link>
    </div>
  );
}
