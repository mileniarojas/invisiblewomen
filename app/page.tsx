import Link from "next/link";
import { getDrugIndex, getTotals } from "@/lib/data";
import { CATEGORY, FEATURED, drugName, featuredInfo } from "@/lib/featured";
import { getT } from "@/lib/i18n/server";
import { DotsCompare } from "@/components/DotsCompare";
import { MedicineGrid } from "@/components/MedicineGrid";

const SOURCES = ["U.S. FDA", "ClinicalTrials.gov", "NIH RxNorm", "Patterns · Cell Press", "openFDA"];
const AMBIEN_SOURCE = "https://www.fda.gov/files/drugs/published/Drug-Safety-Communication--Risk-of-next-morning-impairment-after-use-of-insomnia-drugs--FDA-requires-lower-recommended-doses-for-certain-drugs-containing-zolpidem-(Ambien--Ambien-CR--Edluar--and-Zolpimist).pdf";
const NIH_1993 = "https://grants.nih.gov/policy-and-compliance/policy-topics/inclusion/women-and-minorities/guideline";

export default async function Home() {
  const [{ t, lang }, index, tot] = await Promise.all([getT(), getDrugIndex(), getTotals()]);
  const h = t.home;
  const bySlug = new Map(index.map((d) => [d.slug, d]));
  const items = FEATURED.map((f) => {
    const d = bySlug.get(f.slug)!;
    return { slug: f.slug, name: drugName(f.slug, d.name, lang), use: featuredInfo(f.slug, lang)!.use, pct: d.pctFemale ?? 0, cat: CATEGORY[f.slug] };
  });

  return (
    <>
      {/* Headline */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-12 sm:pt-16 pb-14 grid gap-10 lg:grid-cols-[1.1fr_1fr] items-start">
        <div>
          <p className="eyebrow max-w-xl leading-relaxed">{h.topEyebrow}</p>
          <h1 className="font-serif text-[3.2rem] sm:text-7xl lg:text-[5.4rem] leading-[1.05] mt-5">
            {h.h1a} <span className="underline decoration-rose decoration-[6px] underline-offset-[12px]">{h.h1b}</span>
          </h1>
          <p className="mt-8 text-xl leading-relaxed text-muted max-w-2xl">{h.lead}</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a href="#how" className="btn btn-primary btn-lg">{h.howBtn}</a>
            <Link href="/pregnancy" className="btn btn-outline btn-lg">{h.pregBtn}</Link>
          </div>
        </div>
        <DotsCompare a={15} b={3} labelA={h.dots.women} labelB={h.dots.men} of100={h.dots.of100} caption={h.dots.caption} sourceHref={AMBIEN_SOURCE} sourceLabel={h.dots.source} />
      </section>

      {/* Three ways in */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <ul className="border-t-2 border-ink divide-y divide-line">
          {h.rows.map(([title, access, body, cta, href]) => (
            <li key={title} className="py-8 grid gap-3 md:grid-cols-[18rem_1fr_auto] md:items-baseline">
              <div>
                <h2 className="font-serif text-3xl">{title}</h2>
                <p className="text-muted">{access}</p>
              </div>
              <p className="text-xl">{body}</p>
              <Link href={href} className="link-cta text-xl">{cta}</Link>
            </li>
          ))}
        </ul>
      </section>

      {/* How it works */}
      <section id="how" className="mt-16 bg-card border-y border-line scroll-mt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20 grid gap-12 lg:grid-cols-[1fr_1.2fr] items-start">
          <div>
            <p className="font-serif text-7xl text-rose">{h.year}</p>
            <p className="mt-4 text-xl leading-relaxed">
              {h.yearText} <a href={NIH_1993} target="_blank" rel="noreferrer" className="text-sm font-bold text-plum underline align-super">NIH</a>
            </p>
          </div>
          <div>
            <h2 className="font-serif text-4xl sm:text-5xl mb-8">{h.howTitle}</h2>
            <ol className="space-y-7">
              {[...h.steps, t.gaps.step].map(([a, b], i) => (
                <li key={a} className="flex gap-5">
                  <span className="shrink-0 w-11 h-11 rounded-full bg-rose-soft flex items-center justify-center text-rose-text font-bold text-lg">{i + 1}</span>
                  <div><p className="font-serif text-2xl">{a}</p><p className="text-muted mt-1 leading-relaxed">{b}</p></div>
                </li>
              ))}
            </ol>
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <Link href="/login" className="btn btn-primary btn-lg">{h.ctaBtn}</Link>
              <a href="#medicines" className="link-cta">{h.howBrowse}</a>
            </div>
          </div>
        </div>
      </section>

      {/* Statement band */}
      <section id="found" className="bg-rose-soft scroll-mt-24">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:py-20 text-center">
          <p className="text-xl sm:text-2xl leading-relaxed">{h.band(tot.trials, tot.bySexCount)}</p>
          <p className="mt-6 font-serif text-2xl sm:text-3xl text-rose-text">{h.band2}</p>
        </div>
      </section>

      {/* What the studies show */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
        <p className="eyebrow">{h.resultsEyebrow}</p>
        <h2 className="font-serif text-4xl sm:text-5xl mt-2 mb-8">{h.resultsTitle}</h2>
        <ul className="grid gap-5 sm:grid-cols-3">
          {h.results({ pctWomen: tot.pctWomen, bySexPct: tot.bySexPct, pregRecorded: tot.pregRecorded }).map(([n, l]) => (
            <li key={l} className="card p-7">
              <div className="font-serif text-6xl text-rose">{n}</div>
              <p className="mt-3 text-lg leading-relaxed">{l}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* The women left out */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-20">
        <h2 className="font-serif text-4xl sm:text-5xl mb-8">{h.leftTitle}</h2>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {h.left({ preg: tot.pregExcluded, bf: tot.bfExcluded, age: tot.ageCapped, noRace: tot.noRace, pregRecorded: tot.pregRecorded }).map((c) => (
            <li key={c.t} className="card p-6">
              <h3 className="font-serif text-2xl mb-4">{c.t}</h3>
              <ul className="space-y-2.5">
                {c.items.map((i) => (
                  <li key={i} className="flex gap-2.5"><span className="text-rose font-bold" aria-hidden>✕</span><span>{i}</span></li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      {/* Medicines */}
      <section id="medicines" className="bg-card border-y border-line scroll-mt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
          <h2 className="font-serif text-4xl sm:text-5xl">{h.gridTitle}</h2>
          <p className="text-muted text-lg mt-3 mb-8">{h.gridSub}</p>
          <MedicineGrid items={items} />
        </div>
      </section>

      {/* Sources strip */}
      <section className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-wrap items-center gap-x-10 gap-y-2">
          <span className="eyebrow !text-muted">{h.sourcesLabel}</span>
          {SOURCES.map((s) => <span key={s} className="font-serif text-lg text-muted whitespace-nowrap">{s}</span>)}
        </div>
      </section>

      {/* Get your results */}
      <section className="bg-deep text-paper">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h2 className="font-serif text-4xl">{h.ctaTitle}</h2>
          <p className="mt-3 opacity-80 text-lg">{h.ctaBody}</p>
          <Link href="/login" className="btn btn-lg mt-8 !bg-paper !text-ink !border-paper hover:!bg-rose-soft">{h.ctaBtn}</Link>
        </div>
      </section>
    </>
  );
}
