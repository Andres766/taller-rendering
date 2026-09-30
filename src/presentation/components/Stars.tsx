export function Stars({ value, score }: { value: number | null; score?: number | null }) {
  if (value === null) return <span className="text-xs text-zinc-500">Sin calificación de la crítica</span>;
  const label = score != null ? `${score.toFixed(1)} de 10` : `${value} de 5 estrellas`;
  return (
    <span className="inline-flex items-center gap-1 text-amber-300" aria-label={label} title={label}>
      <span aria-hidden>
        {"★".repeat(value)}
        <span className="text-zinc-600">{"★".repeat(5 - value)}</span>
      </span>
      {score != null && <span className="text-xs text-zinc-300">{score.toFixed(1)}</span>}
    </span>
  );
}
