"use client";

import { useEffect, useState } from "react";

/** Isla: reproductor de tráiler simulado (animación con estado local). */
export function TrailerIsland({ title, palette }: { title: string; palette: [string, string] }) {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setProgress((p) => (p >= 100 ? 0 : p + 2)), 100);
    return () => clearInterval(id);
  }, [open]);

  return (
    <div className="rounded-xl ring-2 ring-teal-400/60">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setProgress(0);
        }}
        aria-expanded={open}
        className="w-full rounded-xl px-3 py-1.5 text-left text-sm font-semibold text-teal-300 hover:bg-teal-400/10"
      >
        {open ? "■ Cerrar tráiler" : "▶ Ver tráiler"}
      </button>
      {open && (
        <div className="p-2 pt-0">
          <div
            className="relative grid h-28 place-items-center overflow-hidden rounded-lg text-center text-xs font-bold text-white"
            style={{ background: `linear-gradient(${progress * 3.6}deg, ${palette[0]}, ${palette[1]})` }}
          >
            <span className="drop-shadow">Tráiler de “{title}” (simulado)</span>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-black/40">
              <div className="h-full bg-white" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
