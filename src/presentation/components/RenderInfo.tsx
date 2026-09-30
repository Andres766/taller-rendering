import { ACCENT_CLASSES, type PatternKey, RenderingPatternCatalog } from "../catalog/RenderingPatterns";
import { fmt } from "../format";
import { LiveClock } from "./LiveClock";

interface RenderInfoProps {
  pattern: PatternKey;
  /** Instante en que se produjo el HTML (ISO). Omitir en CSR: ahí no hay HTML con datos. */
  renderedAt?: string;
  renderedLabel?: string;
  children?: React.ReactNode;
}

/** Panel que explica el patrón de la página y muestra evidencia de cuándo se renderizó. */
export function RenderInfo({ pattern, renderedAt, renderedLabel, children }: RenderInfoProps) {
  const info = RenderingPatternCatalog.get(pattern);
  const accent = ACCENT_CLASSES[info.accent];

  return (
    <section className={`rounded-2xl border ${accent.border} ${accent.bg} p-5 sm:p-6`} aria-label="Cómo se renderiza esta página">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`rounded-full border ${accent.border} px-3 py-1 text-xs font-bold tracking-wider ${accent.text}`}>
          {info.acronym}
        </span>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">{info.name}</h1>
      </div>
      <p className="mt-2 text-zinc-300">
        Caso: <strong className="text-white">{info.useCase}</strong>
      </p>

      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <Item label="¿Cuándo se genera el HTML?">{info.when}</Item>
        <Item label="¿Dónde?">{info.where}</Item>
        <Item label="Implementación en Next.js">
          <code className="break-words font-mono text-xs text-zinc-200">{info.howInNext}</code>
        </Item>
        <Item label="Evidencia">
          {renderedAt ? (
            <div className="space-y-1">
              <div>
                {renderedLabel ?? "HTML generado"}:{" "}
                <span className={`font-mono font-semibold ${accent.text}`}>{fmt.clock(renderedAt)}</span>
              </div>
              <div>
                Tu navegador: <LiveClock since={renderedAt} />
              </div>
            </div>
          ) : (
            children
          )}
        </Item>
      </dl>

      <p className="mt-4 text-sm text-zinc-400">
        <span aria-hidden>🔎 </span>
        {info.howToVerify}
      </p>
      {renderedAt && children && <div className="mt-3">{children}</div>}
    </section>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-zinc-400">{label}</dt>
      <dd className="mt-1 text-zinc-200">{children}</dd>
    </div>
  );
}
