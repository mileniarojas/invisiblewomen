import Link from "next/link";
import { MIN_REPORTS, memberStats } from "@/lib/memberStats";
import { getT } from "@/lib/i18n/server";

/** Community-reported side effects for one medicine, shown only once enough women have reported. */
export async function MemberReport({ slug, med }: { slug: string; med: string }) {
  const [{ t }, s] = await Promise.all([getT(), memberStats(slug)]);
  const M = t.members;
  if (!s) return null;
  return (
    <div className="card p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="font-serif text-2xl">{M.title}</h3>
        <span className="text-muted">{M.count(s.members)}</span>
      </div>
      <p className="text-muted mt-1">{M.sub}</p>
      {s.members < MIN_REPORTS || s.effects.length === 0 ? (
        <p className="mt-5 rounded-xl bg-rose-soft/60 px-4 py-3">{M.tooFew(s.members, MIN_REPORTS)}</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {s.effects.map((e) => (
            <li key={e.name} className="grid grid-cols-[minmax(0,12rem)_1fr_3.5rem] items-center gap-4">
              <span className="capitalize">{e.name}</span>
              <span className="h-3 rounded-full bg-line overflow-hidden"><span className="block h-full rounded-full bg-rose" style={{ width: `${e.pct}%` }} /></span>
              <b className="text-right tabular-nums">{e.pct}%</b>
            </li>
          ))}
        </ul>
      )}
      <Link href="#share" className="btn btn-primary mt-6">{M.share(med)}</Link>
    </div>
  );
}
