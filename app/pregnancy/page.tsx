import Link from "next/link";
import { getDrug, getDrugIndex, getTotals } from "@/lib/data";
import { FEATURED, drugName } from "@/lib/featured";
import { LABEL_NOTES } from "@/lib/labelNotes";
import { getT } from "@/lib/i18n/server";
import type { DrugDetail } from "@/lib/types";

const FDA_REGISTRIES = "https://www.fda.gov/consumers/pregnancy-exposure-registries/list-pregnancy-exposure-registries";

export async function generateMetadata() { return { title: (await getT()).t.pregnancyPage.title }; }

export default async function Pregnancy() {
  const [{ t, lang }, tot, index] = await Promise.all([getT(), getTotals(), getDrugIndex()]);
  const P = t.pregnancyPage;
  const drugs = (await Promise.all(FEATURED.map((f) => getDrug(f.slug)))).filter((d): d is DrugDetail => !!d);
  const withPregStudy = drugs.filter((d) => d.focus.pregnancy.some((x) => x.results)).length;
  const stats = [P.stat1(tot.pregExcluded, tot.trials), P.stat2(tot.pregRecorded), P.stat3(withPregStudy, index.length)];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <h1 className="font-serif text-6xl">{P.title}</h1>
      <ul className="grid gap-5 sm:grid-cols-3 mt-8">
        {stats.map(([n, l]) => (
          <li key={l} className="card p-7">
            <div className="font-serif text-5xl text-rose">{n}</div>
            <p className="mt-3 text-lg leading-relaxed text-muted">{l}</p>
          </li>
        ))}
      </ul>
      <p className="font-serif text-3xl leading-snug max-w-3xl mt-12">{P.lead}</p>

      <section className="card p-7 mt-12 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <h2 className="font-serif text-3xl">{P.registryTitle}</h2>
          <p className="text-muted text-lg mt-2">{P.registryBody}</p>
        </div>
        <a href={FDA_REGISTRIES} target="_blank" rel="noreferrer" className="btn btn-primary">{P.registryLink} ↗</a>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-4xl mb-6">{P.tableTitle}</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-line">
              <tr className="text-muted">
                <th className="p-4 font-bold">{P.colMed}</th>
                <th className="p-4 font-bold">{P.colBarred}</th>
                <th className="p-4 font-bold">{P.colFocused}</th>
                <th className="p-4 font-bold min-w-[20rem]">{P.colLabel}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {drugs.map((d) => {
                const f = d.focus.pregnancy;
                return (
                  <tr key={d.slug} className="align-top">
                    <td className="p-4"><Link href={`/drugs/${d.slug}#like-me`} className="font-bold text-plum underline capitalize">{drugName(d.slug, d.name, lang)}</Link></td>
                    <td className="p-4 font-serif text-2xl text-rose">{Math.round(d.summary.exclusionPct.pregnant_excluded ?? 0)}%</td>
                    <td className="p-4">{P.focused(f.length, f.filter((x) => x.results).length)}</td>
                    <td className="p-4 text-muted leading-relaxed">{LABEL_NOTES[d.slug]?.[lang]?.pregnant}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <p className="text-sm text-muted mt-6">{t.summary.notConclusive}</p>
    </div>
  );
}
