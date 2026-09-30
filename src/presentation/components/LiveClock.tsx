"use client";

import { fmt } from "../format";
import { useNow } from "../hooks/useNow";

/** Isla de cliente: reloj del navegador para compararlo con la hora de render del HTML. */
export function LiveClock({ since }: { since?: string }) {
  const now = useNow();
  if (now === null) return <span className="text-zinc-500">--:--:--</span>;

  const ageSeconds = since ? Math.max(0, Math.round((now - new Date(since).getTime()) / 1000)) : null;
  return (
    <span>
      <span className="font-mono text-zinc-100">{fmt.clock(new Date(now))}</span>
      {ageSeconds !== null && (
        <span className="ml-2 text-xs text-zinc-400">(el HTML tiene {formatAge(ageSeconds)})</span>
      )}
    </span>
  );
}

function formatAge(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ${seconds % 60} s`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} h ${minutes % 60} min`;
  return `${Math.floor(hours / 24)} días`;
}
