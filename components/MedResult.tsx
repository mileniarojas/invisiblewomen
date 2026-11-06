import Link from "next/link";
import { ingredientsFor, loadDrug } from "@/lib/live";
import { drugName, featuredInfo } from "@/lib/featured";
import { getT } from "@/lib/i18n/server";
import { personalRows, type ProfileLike } from "@/lib/personal";
import type { MedRow } from "@/lib/supabase/server";
import { StatusDot } from "./StatusDot";
import { Evidence } from "./Evidence";


export function MedSkeleton({ name }: { name: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-6 animate-pulse">
      <p className="font-serif text-3xl capitalize text-deep">{name}</p>
      <div className="mt-4 h-3 w-2/3 rounded bg-rose-soft" />
      <div className="mt-3 h-3 w-1/2 rounded bg-rose-soft" />
    </div>
  );
}

/** One of the user's medicines: resolves to ingredients and shows "women like you" for each. */
export async function MedResult({ med, profile }: { med: MedRow; profile: ProfileLike }) {
  const { t, lang } = await getT();
  const ingredients = await ingredientsFor(med.name, med.rxcui);
  if (!ingredients.length) return <div className="rounded-2xl border border-line bg-card p-6"><p className="font-serif text-2xl capitalize">{med.name}</p><p className="text-muted mt-2">{t.my.unknownMed}</p></div>;
  const drugs = await Promise.all(ingredients.map(async (ing) => {
    try { return { ing, drug: await loadDrug(ing), failed: false }; } catch { return { ing, drug: null, failed: true }; }
  }));
  const brand = ingredients.length > 1 || ingredients[0] !== med.name.toLowerCase() ? med.name : null;

  return (
    <>
      {drugs.map(({ ing, drug, failed }) => {
        const name = drug ? drugName(drug.slug, drug.name, lang) : ing;
        const info = drug ? featuredInfo(drug.slug, lang) : undefined;
        const rows = drug && drug.summary.trials > 0 ? personalRows(profile, drug, t) : [];
        return (
          <article key={ing} className="rounded-2xl border border-line bg-card p-6 sm:p-8">
            <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="font-serif text-3xl sm:text-4xl capitalize text-deep">{name}</h2>
              {brand && <span className="text-muted capitalize">{t.my.from(brand)}</span>}
            </header>
            {info && <p className="mt-1">{info.use}</p>}
            {!drug ? <p className="text-muted mt-4">{failed ? t.my.lookupFailed : t.my.unknownMed}</p> : drug.summary.trials === 0 ? <p className="text-muted mt-4">{t.my.noStudies}</p> : (
              <>
                <div className="mt-5 rounded-lg bg-rose-soft/60 px-4 py-3 max-w-md">
                  <div className="flex items-baseline gap-2">
                    <span className={`font-serif text-2xl ${(drug.pctFemale ?? 0) < 50 ? "text-rose" : "text-deep"}`}>{drug.pctFemale ?? "—"}%</span>
                    <span className="text-xs text-muted">{t.home.tileLabel} · {t.my.studies(drug.summary.trials)}</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-card overflow-hidden" aria-hidden><div className="h-full rounded-full bg-rose" style={{ width: `${drug.pctFemale ?? 0}%` }} /></div>
                </div>
                <h3 className="eyebrow mt-6 mb-3">{t.my.womenLikeYou}</h3>
                <ul className="space-y-2.5">
                  {rows.map((row) => (
                    <li key={row.text} className="flex gap-3 items-start"><StatusDot s={row.status} /><div><span className="leading-snug">{row.text}</span><Evidence e={row.evidence} label={t.summary.rule} /></div></li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <Link href={`/drugs/${drug.slug}`} className="btn btn-primary">{t.my.full}</Link>
                  {drug.live && <span className="text-xs text-muted">{t.my.live}</span>}
                </div>
              </>
            )}
          </article>
        );
      })}
    </>
  );
}
