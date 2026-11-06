import Link from "next/link";
import type { DrugDetail, Trial } from "@/lib/types";
import type { Dict } from "@/lib/i18n";
import type { ExclusionFlag } from "@/lib/exclusions";
import { Gap, fmt } from "./ui";

/** Pre-built medicines have local study pages; live look-ups link straight to ClinicalTrials.gov. */
const trialHref = (nct: string, live?: boolean) => (live ? `https://clinicaltrials.gov/study/${nct}` : `/trials/${nct}`);

const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);

export function SexSplit({ female, male, t }: { female: number; male: number; t: Dict }) {
  const total = female + male;
  const p = pctOf(female, total);
  const m = Math.round((100 - p) * 10) / 10;
  return (
    <div>
      <div className="relative flex h-8 rounded-lg overflow-hidden" role="img" aria-label={`${p}% ${t.who.women}, ${m}% ${t.who.men}`}>
        <div className="bg-rose flex items-center px-3 text-paper text-sm font-semibold" style={{ width: `${Math.max(p, 4)}%` }}>{p >= 12 && `${p}%`}</div>
        <div className="bg-men flex items-center justify-end px-3 text-ink text-sm font-semibold flex-1">{m >= 12 && `${m}%`}</div>
        <div className="absolute left-1/2 inset-y-0 border-l-2 border-dashed border-paper/90" aria-hidden />
      </div>
      <div className="flex justify-between text-sm mt-2 gap-2">
        <span><b className="text-rose">{fmt(female)}</b> {t.who.women}</span>
        <span className="text-muted text-xs text-center">{t.who.parity}</span>
        <span><b>{fmt(male)}</b> {t.who.men}</span>
      </div>
    </div>
  );
}

function Bars({ data, total, t }: { data: [string, number][]; total: number; t: Dict }) {
  return (
    <ul className="space-y-2">
      {data.map(([k, v]) => (
        <li key={k} className="grid grid-cols-[minmax(0,11rem)_1fr_3.5rem] items-center gap-3 text-sm">
          <span>{t.race[k] ?? k}</span>
          <span className="h-2.5 rounded-full bg-line overflow-hidden"><span className="block h-full bg-plum" style={{ width: `${pctOf(v, total)}%` }} /></span>
          <span className="text-right tabular-nums">{pctOf(v, total)}%</span>
        </li>
      ))}
    </ul>
  );
}

export function WhoWasInTrials({ drug, t }: { drug: DrugDetail; t: Dict }) {
  const s = drug.summary;
  const raceTotal = Object.values(s.race).reduce((a, b) => a + b, 0);
  const race = Object.entries(s.race).filter(([k]) => k !== "Not reported").sort((a, b) => b[1] - a[1]).slice(0, 5);
  const ethTotal = s.hispanic.yes + s.hispanic.no;
  const aged = drug.trialList.filter((x) => x.pct65 !== null && x.n);
  const agedN = aged.reduce((a, x) => a + (x.n ?? 0), 0);
  const pct65 = agedN ? Math.round(aged.reduce((a, x) => a + (x.pct65! / 100) * (x.n ?? 0), 0) / agedN * 1000) / 10 : null;
  return (
    <div className="card p-6 sm:p-8 space-y-8">
      <div>
        <p className="text-sm text-muted mb-3">{t.who.peopleAcross(s.participants, s.trialsWithSex)}</p>
        <SexSplit female={s.female} male={s.participants - s.female} t={t} />
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h3 className="font-serif text-lg mb-3">{t.who.race}</h3>
          {raceTotal ? <Bars data={race} total={raceTotal} t={t} /> : <Gap>{t.notReported}</Gap>}
          <p className="text-xs text-muted mt-3">{t.who.raceNote}</p>
        </div>
        <dl className="space-y-4 text-sm">
          <div className="flex justify-between border-b border-line pb-3"><dt>{t.who.hispanic}</dt><dd className="font-semibold">{ethTotal ? `${pctOf(s.hispanic.yes, ethTotal)}%` : <Gap>{t.notReported}</Gap>}</dd></div>
          <div className="flex justify-between border-b border-line pb-3"><dt>{t.who.aged65}</dt><dd className="font-semibold">{pct65 !== null ? `${pct65}%` : <Gap>{t.notReported}</Gap>}</dd></div>
          <div className="flex justify-between border-b border-line pb-3"><dt>{t.who.menOnly}</dt><dd className="font-semibold">{s.menOnlyTrials}</dd></div>
          <div className="flex justify-between"><dt>{t.who.womenOnly}</dt><dd className="font-semibold">{s.womenOnlyTrials}</dd></div>
        </dl>
      </div>
    </div>
  );
}

export function ExclusionList({ drug, t }: { drug: DrugDetail; t: Dict }) {
  const entries = (Object.entries(drug.summary.exclusionPct) as [ExclusionFlag, number][])
    .filter(([f]) => f !== "kidney_liver_excluded")
    .sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (!entries.length) return <p className="text-muted">{t.noRules}</p>;
  const example = (f: ExclusionFlag) => {
    for (const tr of drug.trialList) {
      const e = tr.exclusions.find((x) => x.flag === f);
      if (e) return { tr, q: e.quote };
    }
    return null;
  };
  return (
    <ul className="card divide-y divide-line">
      {entries.map(([flag, p]) => {
        const ex = example(flag);
        return (
          <li key={flag} className="p-5 flex items-baseline gap-4">
            <span className="font-serif text-2xl text-rose w-16 shrink-0 tabular-nums">{Math.round(p)}%</span>
            <div className="flex-1">
              <h3 className="font-semibold">{t.flags[flag].label}</h3>
              <p className="text-sm text-muted">{t.flags[flag].who}</p>
              {ex && (
                <details className="mt-2 text-sm">
                  <summary className="cursor-pointer text-muted hover:text-ink">{t.seeRule}</summary>
                  <blockquote lang="en" className="mt-2 italic border-l-2 border-rose-soft pl-3">“{ex.q}” <Link href={trialHref(ex.tr.nct, drug.live)} className="not-italic underline">{ex.tr.nct}</Link></blockquote>
                </details>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function MissingDataChecklist({ drug, t }: { drug: DrugDetail; t: Dict }) {
  const r = drug.summary.reporting;
  const items = (["sexStratified", "pregnancy", "menopause", "bmi", "ethnicity", "race"] as const).map((k) => [t.missingItems[k], r[k]] as const);
  return (
    <ul className="grid gap-3 grid-cols-2 lg:grid-cols-3">
      {items.map(([label, p]) => (
        <li key={label} className={`card p-5 ${p < 25 ? "!bg-rose-soft/50 !border-rose-soft" : ""}`}>
          <div className={`font-serif text-3xl tabular-nums ${p < 25 ? "text-rose" : "text-sage"}`}>{Math.round(p)}%</div>
          <div className="text-sm mt-1">{label}</div>
        </li>
      ))}
    </ul>
  );
}

const phase = (x: Trial) => x.phases.map((p) => p.replace("PHASE", "").replace("EARLY_1", "Early 1").replace("NA", "—")).join("/") || "—";

export function TrialTable({ trials, t, live }: { trials: Trial[]; t: Dict; live?: boolean }) {
  return (
    <div className="card overflow-x-auto">
      <p className="text-xs text-muted p-3 border-b border-line">{t.drug.englishOnly}</p>
      <table className="w-full text-sm">
        <thead className="text-left text-muted border-b border-line">
          <tr>
            <th className="p-3 font-semibold">{t.drug.study}</th>
            <th className="p-3 font-semibold">{t.trial.phase}</th>
            <th className="p-3 font-semibold text-right">{t.groups.people}</th>
            <th className="p-3 font-semibold text-right">% {t.who.women}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {trials.slice(0, 40).map((x) => {
            const total = (x.female ?? 0) + (x.male ?? 0);
            const p = total ? pctOf(x.female ?? 0, total) : null;
            return (
              <tr key={x.nct} className="align-top">
                <td className="p-3 min-w-[16rem]" lang="en">
                  <Link href={trialHref(x.nct, live)} className="font-medium hover:text-rose">{x.title}</Link>
                  <div className="text-xs text-muted">{x.nct}</div>
                </td>
                <td className="p-3 whitespace-nowrap">{phase(x)}</td>
                <td className="p-3 text-right tabular-nums">{x.n ? fmt(x.n) : "—"}</td>
                <td className={`p-3 text-right tabular-nums font-semibold ${p !== null && p < 40 ? "text-rose" : ""}`}>{p === null ? "—" : `${p}%`}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
