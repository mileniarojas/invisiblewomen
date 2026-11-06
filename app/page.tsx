import Link from "next/link";
import { getDrugIndex, getTotals } from "@/lib/data";
import { CATEGORY, FEATURED, drugName, featuredInfo } from "@/lib/featured";
import { getT } from "@/lib/i18n/server";
import { HeroArt } from "@/components/HeroArt";
import { MedicineGrid } from "@/components/MedicineGrid";

const SOURCES = ["U.S. FDA", "ClinicalTrials.gov", "NIH RxNorm", "Patterns · Cell Press", "openFDA"];

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
      {/* Hero */}
      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20 grid gap-10 md:grid-cols-[1.2fr_1fr] items-center">
          <div>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl leading-[1.05] text-deep">
              {h.h1a} <span className="underline decoration-rose decoration-4 underline-offset-[10px]">{h.h1b}</span>
            </h1>
            <div className="mt-10 flex flex-col items-start gap-3">
              <a href="#medicines" className="btn btn-primary btn-lg">{h.cta}</a>
              <p className="text-sm text-muted">{h.sub}</p>
              <a href="#found" className="link-cta mt-3 text-deep">{h.link}</a>
            </div>
          </div>
          <div className="max-w-sm md:max-w-none mx-auto w-full"><HeroArt /></div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-card border-y border-line scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-20 grid gap-10 md:grid-cols-2 items-center">
          <div className="rounded-2xl bg-sage-soft/60 aspect-[4/3] flex items-center justify-center p-10">
            <div className="grid grid-cols-5 gap-3" aria-hidden>
              {Array.from({ length: 25 }).map((_, i) => (
                <svg key={i} viewBox="0 0 24 24" className={`w-8 h-8 sm:w-10 sm:h-10 ${i % 5 < 2 ? "text-rose" : "text-deep/25"}`}>
                  <circle cx="12" cy="7" r="4" fill="currentColor" />
                  <path d="M4 22c1-6 4-9 8-9s7 3 8 9z" fill="currentColor" />
                </svg>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-serif text-4xl sm:text-5xl text-deep mb-8">{h.howTitle}</h2>
            <ol className="space-y-6">
              {h.steps.map(([a, b], i) => (
                <li key={a} className="flex gap-4">
                  <span className="shrink-0 w-10 h-10 rounded-full bg-card border border-line flex items-center justify-center text-rose font-semibold">{i + 1}</span>
                  <div><p className="font-semibold text-deep text-lg">{a}</p><p className="text-sm text-muted">{b}</p></div>
                </li>
              ))}
            </ol>
            <a href="#medicines" className="btn btn-primary btn-lg mt-10">{h.cta}</a>
          </div>
        </div>
      </section>

      {/* Statement band */}
      <section id="found" className="bg-rose-soft scroll-mt-20">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:py-20 text-center">
          <p className="text-xl sm:text-2xl leading-relaxed text-deep">{h.band(tot.trials, tot.bySexCount)}</p>
          <p className="mt-6 font-serif text-2xl sm:text-3xl text-rose">{h.band2}</p>
        </div>
      </section>

      {/* Results */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="font-serif text-4xl sm:text-5xl text-center text-deep">{h.resultsTitle}</h2>
        <p className="eyebrow text-center mt-6 mb-6">{h.resultsEyebrow}</p>
        <ul className="grid gap-4 sm:grid-cols-3">
          {h.results({ pctWomen: tot.pctWomen, bySexPct: tot.bySexPct, pregRecorded: tot.pregRecorded }).map(([n, l]) => (
            <li key={l} className="rounded-xl bg-rose-soft/60 p-8 text-center">
              <div className="font-serif text-6xl text-deep">{n}</div>
              <p className="text-sm mt-3 max-w-[14rem] mx-auto">{l}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* The women left out */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <p className="eyebrow text-center">{h.leftSub}</p>
        <h2 className="font-serif text-4xl sm:text-5xl text-center text-deep mt-2 mb-10">{h.leftTitle}</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {h.left({ preg: tot.pregExcluded, bf: tot.bfExcluded, age: tot.ageCapped, noRace: tot.noRace, pregRecorded: tot.pregRecorded }).map((c) => (
            <li key={c.t} className="rounded-xl bg-rose-soft/60 p-6">
              <h3 className="font-semibold text-deep mb-3">{c.t}</h3>
              <ul className="space-y-2 text-sm">
                {c.items.map((i) => (
                  <li key={i} className="flex gap-2"><span className="text-rose font-bold" aria-hidden>✕</span><span>{i}</span></li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <div className="text-center mt-10"><a href="#medicines" className="btn btn-primary btn-lg">{h.cta}</a></div>
      </section>

      {/* Medicines */}
      <section id="medicines" className="mx-auto max-w-6xl px-4 py-20 scroll-mt-20">
        <h2 className="font-serif text-4xl sm:text-5xl text-center text-deep">{h.gridTitle}</h2>
        <p className="text-center text-muted mt-3 mb-10">{h.gridSub}</p>
        <MedicineGrid items={items} />
      </section>

      {/* Sources strip */}
      <section className="bg-rose-soft py-4 overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-2">
          <span className="text-xs uppercase tracking-[0.14em] text-muted">{h.sourcesLabel}</span>
          {SOURCES.map((s) => <span key={s} className="font-serif text-lg text-deep/80 whitespace-nowrap">{s}</span>)}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-deep text-paper">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h2 className="font-serif text-4xl">{h.ctaTitle}</h2>
          <p className="mt-3 opacity-80">{h.ctaBody}</p>
          <Link href="/login" className="btn btn-lg mt-8 bg-paper text-deep hover:bg-rose-soft">{h.ctaBtn}</Link>
        </div>
      </section>
    </>
  );
}
