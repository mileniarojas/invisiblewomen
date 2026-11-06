"use client";
import { useState } from "react";
import { useT } from "@/lib/i18n/client";
import type { FocusTrial } from "@/lib/types";

export type GroupView = { key: string; title: string; verdict: "no" | "barely" | "partly" | "yes" | "unknown"; studied: string; known: string[]; label?: string; trials?: FocusTrial[] };

const CHIP = {
  no: "bg-rose text-paper", barely: "bg-rose-soft text-rose", partly: "bg-amber-soft text-ink", yes: "bg-sage-soft text-sage", unknown: "bg-ghost/60 text-ink",
};

export function GroupTabs({ groups }: { groups: GroupView[] }) {
  const all = useT();
  const g = all.groups, d = all.drug2;
  const [k, setK] = useState(groups[0]?.key);
  const x = groups.find((y) => y.key === k) ?? groups[0];
  if (!x) return null;
  return (
    <div>
      <div role="tablist" className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:flex-wrap sm:justify-center sm:overflow-visible">
        {groups.map((y) => (
          <button key={y.key} role="tab" aria-selected={y.key === k} className="pill-tab" onClick={() => setK(y.key)}>{d.short[y.key] ?? y.title}</button>
        ))}
      </div>
      <div role="tabpanel" className="mt-6 rounded-2xl bg-card border border-line p-6 sm:p-10 grid gap-8 md:grid-cols-[1fr_1.3fr]">
        <div>
          <span className={`chip ${CHIP[x.verdict]} !text-xs !px-3 !py-1 uppercase tracking-wider`}>{g.verdict[x.verdict]}</span>
          <h3 className="font-serif text-3xl text-deep mt-4">{x.title}</h3>
          <p className="mt-4 leading-relaxed">{x.studied}</p>
        </div>
        <div className="md:border-l md:border-line md:pl-8">
          <p className="eyebrow mb-3">{g.resultsQ}</p>
          {x.known.map((s) => <p key={s} className="leading-relaxed">{s}</p>)}
          {x.label && (
            <div className="rounded-xl bg-sage-soft/50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-sage mb-2">{g.labelSays}</p>
              <p className="leading-relaxed">{x.label}</p>
            </div>
          )}
          {x.trials && x.trials.length > 0 && (
            <details className="text-sm mt-5">
              <summary className="cursor-pointer text-muted hover:text-ink">{g.focusedTrials} ({x.trials.length})</summary>
              <ul className="mt-2 space-y-1.5">
                {x.trials.map((f) => (
                  <li key={f.nct}>
                    <a className="underline" lang="en" href={`https://clinicaltrials.gov/study/${f.nct}`} target="_blank" rel="noreferrer">{f.title}</a>
                    <span className="text-muted"> · {f.n ?? "?"} {g.people} · {f.results ? g.resultsPosted : g.noResultsPosted}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
