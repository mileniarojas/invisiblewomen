"use client";
import { useMemo, useState } from "react";
import { useT } from "@/lib/i18n/client";

/** Per medicine: one entry per member (anonymous number) with the side effects she reported. */
export type MedReports = { slug: string; name: string; members: { id: number; effects: string[] }[] };

const MIN = 5;

/** "Side effects members report": pick medicines, see what share of members taking them reported each effect. */
export function CommunityStats({ meds, total }: { meds: MedReports[]; total: number }) {
  const C = useT().communityPage;
  const first = meds.find((m) => m.members.length > 0) ?? meds[0];
  const [picked, setPicked] = useState<string[]>(first ? [first.slug] : []);
  const toggle = (s: string) => setPicked((p) => (p.includes(s) ? (p.length > 1 ? p.filter((x) => x !== s) : p) : [...p, s]));

  const { n, rows, names } = useMemo(() => {
    const chosen = meds.filter((m) => picked.includes(m.slug));
    const byMember = new Map<number, Set<string>>();
    for (const m of chosen) for (const mem of m.members) {
      const set = byMember.get(mem.id) ?? new Set<string>();
      mem.effects.forEach((e) => set.add(e));
      byMember.set(mem.id, set);
    }
    const counts = new Map<string, number>();
    for (const set of byMember.values()) for (const e of set) counts.set(e, (counts.get(e) ?? 0) + 1);
    const n = byMember.size;
    const rows = [...counts.entries()].map(([e, c]) => ({ e, pct: Math.round((c / Math.max(n, 1)) * 100) })).sort((a, b) => b.pct - a.pct).slice(0, 5);
    const ns = chosen.map((m) => m.name);
    const names = ns.length <= 2 ? ns.join(C.and) : `${ns.slice(0, -1).join(", ")},${C.and}${ns[ns.length - 1]}`;
    return { n, rows, names };
  }, [meds, picked, C.and]);

  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return (
    <div className="card p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="font-semibold">{C.pickTitle} <span className="font-normal text-muted text-sm">· {C.pickHint}</span></p>
        <p className="text-sm text-muted">{C.studyReports(total)}</p>
      </div>
      <div role="group" aria-label={C.pickTitle} className="flex flex-wrap gap-2 mt-4">
        {meds.map((m) => {
          const on = picked.includes(m.slug);
          return (
            <button key={m.slug} type="button" role="checkbox" aria-checked={on} onClick={() => toggle(m.slug)}
              className={`inline-flex items-center gap-2 rounded-full border-[1.5px] px-4 py-1.5 text-sm transition ${on ? "border-plum bg-plum-soft font-semibold" : "border-line bg-card hover:border-rose"}`}>
              <span aria-hidden className={`w-4 h-4 rounded-[4px] border-[1.5px] flex items-center justify-center text-[10px] ${on ? "bg-plum border-plum text-white" : "border-edge"}`}>{on ? "✓" : ""}</span>
              <span className="capitalize">{m.name}</span>
            </button>
          );
        })}
      </div>

      {n >= MIN && rows.length > 0 ? (
        <>
          <p className="font-serif text-3xl sm:text-4xl leading-snug mt-7 max-w-3xl">
            <span className="text-rose">{rows[0].pct}%</span> {C.headline(rows[0].pct, cap(names), rows[0].e).replace(/^\d+%\s*/, "")}
          </p>
          <ul className="mt-6 space-y-3">
            {rows.map((r) => (
              <li key={r.e} className="grid grid-cols-[minmax(0,10rem)_1fr_3rem] sm:grid-cols-[minmax(0,14rem)_1fr_3.5rem] items-center gap-4">
                <span className="capitalize">{r.e}</span>
                <span className="h-3 rounded-full bg-line overflow-hidden"><span className="block h-full rounded-full bg-rose" style={{ width: `${r.pct}%` }} /></span>
                <b className="text-right tabular-nums">{r.pct}%</b>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted mt-4">{C.outOf(n, cap(names))}</p>
        </>
      ) : (
        <p className="mt-6 rounded-xl bg-rose-soft/60 px-4 py-3">{n === 0 ? C.noneYet : C.tooFew(n, MIN, cap(names))}</p>
      )}
      <p className="text-xs text-muted mt-4">{C.realOnly}</p>
    </div>
  );
}
