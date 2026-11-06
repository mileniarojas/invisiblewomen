import Link from "next/link";
import { notFound } from "next/navigation";
import { getTrial } from "@/lib/data";
import { getT } from "@/lib/i18n/server";
import { drugName } from "@/lib/featured";
import { SexSplit } from "@/components/TrialSections";
import { Gap } from "@/components/ui";

export async function generateMetadata({ params }: { params: Promise<{ nct: string }> }) {
  return { title: (await params).nct.toUpperCase() };
}

export default async function TrialPage({ params }: { params: Promise<{ nct: string }> }) {
  const { nct } = await params;
  const [r, { t, lang }] = await Promise.all([getTrial(nct), getT()]);
  if (!r) notFound();
  const x = r.trial, tt = t.trial;
  const gap = <Gap>{t.notReported}</Gap>;
  const rows: [string, React.ReactNode][] = [
    [tt.phase, x.phases.join(", ") || "—"],
    [tt.sponsor, x.sponsor ?? "—"],
    [tt.completed, x.completion ?? "—"],
    [tt.conditions, <span key="c" lang="en">{x.conditions.join(", ") || "—"}</span>],
    [tt.whoCould, x.sexEligible === "ALL" ? tt.allSexes : x.sexEligible === "FEMALE" ? tt.womenOnly : <b className="text-rose">{tt.menOnly}</b>],
    [tt.ages, `${x.minAge ?? tt.noMin} – ${x.maxAge ?? tt.noMax}`],
    [tt.avgAge, x.ageMean ?? gap],
    [tt.aged65, x.pct65 !== null ? `${x.pct65}%` : gap],
    [tt.bmi, x.bmi ?? gap],
    [tt.preg, x.reports.pregnancy ? tt.reported : gap],
    [tt.meno, x.reports.menopause ? tt.reported : gap],
    [tt.bySex, x.sexStratified ? tt.someBySex : <Gap key="s">{tt.notBySex}</Gap>],
  ];
  const race = Object.entries(x.race ?? {}).sort((a, b) => b[1] - a[1]);
  const raceTotal = race.reduce((a, [, v]) => a + v, 0);
  return (
    <article className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      <nav className="text-sm text-muted">{tt.for} {r.drugs.map((d, i) => <span key={d.slug}>{i > 0 && ", "}<Link className="underline capitalize" href={`/drugs/${d.slug}`}>{drugName(d.slug, d.name, lang)}</Link></span>)}</nav>
      <header>
        <p className="text-sm font-mono text-muted">{x.nct}</p>
        <h1 className="font-serif text-3xl" lang="en">{x.title}</h1>
        <a className="text-sm underline text-rose" href={`https://clinicaltrials.gov/study/${x.nct}`} target="_blank" rel="noreferrer">{tt.view}</a>
      </header>
      <div className="card p-6">
        <h2 className="font-semibold mb-3">{x.n ? tt.participants(x.n) : ""}</h2>
        {x.female !== null || x.male !== null ? <SexSplit female={x.female ?? 0} male={x.male ?? 0} t={t} /> : gap}
      </div>
      <dl className="card divide-y divide-line">
        {rows.map(([k, v]) => <div key={k} className="grid grid-cols-[9rem_1fr] gap-4 p-3 text-sm"><dt className="text-muted">{k}</dt><dd>{v}</dd></div>)}
        <div className="grid grid-cols-[9rem_1fr] gap-4 p-3 text-sm"><dt className="text-muted">{tt.race}</dt><dd>{raceTotal ? race.map(([k, v]) => `${t.race[k] ?? k} ${Math.round((v / raceTotal) * 1000) / 10}%`).join(" · ") : gap}</dd></div>
      </dl>
      <section>
        <h2 className="font-serif text-2xl mb-3">{tt.leftOut}</h2>
        {x.exclusions.length ? (
          <ul className="space-y-3">{x.exclusions.map((e) => (
            <li key={e.flag} className="card p-4"><b>{t.flags[e.flag].label}</b><p className="text-sm text-muted">{t.flags[e.flag].who}</p><blockquote lang="en" className="text-sm italic mt-2 border-l-2 border-line pl-3">“{e.quote}”</blockquote></li>
          ))}</ul>
        ) : <p className="text-muted">{tt.none}</p>}
        <p className="text-xs text-muted mt-3">{t.drug.englishOnly}</p>
      </section>
    </article>
  );
}
