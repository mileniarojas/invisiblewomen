import type { Adr } from "@/lib/types";
import type { Dict } from "@/lib/i18n";

/** Top side effects reported more often by women, as "× more" bars, in plain words. */
export function AdrRiskChart({ risks, t }: { risks: Adr[]; t: Dict }) {
  const shown = risks.slice(0, 8);
  if (!shown.length) return <p className="text-muted">{t.adr.none}</p>;
  const max = Math.max(...shown.map((r) => Math.exp(r.logRor)));
  return (
    <div className="card p-6 sm:p-8">
      <ul className="space-y-4">
        {shown.map((r) => {
          const v = Math.exp(r.logRor);
          const w = Math.round(((v - 1) / (max - 1 || 1)) * 9000) / 100 + 10;
          return (
            <li key={`${r.event}-${r.level}`} className="text-sm">
              <div className="flex justify-between gap-3 mb-1.5"><span>{t.events[r.event] ?? r.event}</span><b className="tabular-nums text-rose whitespace-nowrap">{t.adr.times(v.toFixed(1))}</b></div>
              <div className="h-2 rounded-full bg-line"><div className="h-2 rounded-full bg-rose" style={{ width: `${w}%` }} /></div>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted mt-6">{t.adr.note}</p>
    </div>
  );
}
