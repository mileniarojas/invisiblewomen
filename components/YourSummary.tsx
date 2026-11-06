import { loadDrug, ingredientsFor } from "@/lib/live";
import { drugName } from "@/lib/featured";
import { getT } from "@/lib/i18n/server";
import { buildSummary, type SummaryItem } from "@/lib/insights";
import type { ProfileLike } from "@/lib/personal";
import type { MedRow } from "@/lib/supabase/server";
import type { DrugDetail } from "@/lib/types";
import { StatusDot } from "./StatusDot";
import { Evidence } from "./Evidence";

export function SummarySkeleton({ text }: { text: string }) {
  return <div className="rounded-2xl border border-line bg-card p-6 sm:p-8 animate-pulse text-muted">{text}</div>;
}

function Item({ x, t }: { x: SummaryItem; t: Awaited<ReturnType<typeof getT>>["t"] }) {
  const S = t.summary;
  return (
    <li className="flex gap-3 items-start">
      <StatusDot s={x.status} />
      <div>
        <p className="leading-snug"><b className="capitalize">{x.med}:</b> {x.text}</p>
        <p className="text-xs text-muted mt-0.5">{x.source === "studies" ? S.source.studies(x.trials ?? 0) : S.source[x.source]}</p>
        <Evidence e={x.evidence} label={S.rule} />
      </div>
    </li>
  );
}

/** "What matters most for you": the strongest findings across all of a woman's medicines, each with its source. */
export async function YourSummary({ meds, profile }: { meds: MedRow[]; profile: ProfileLike }) {
  const { t, lang } = await getT();
  const S = t.summary;
  const loaded: { name: string; drug: DrugDetail }[] = [];
  for (const m of meds) {
    const ings = await ingredientsFor(m.name, m.rxcui).catch(() => []);
    for (const ing of ings) {
      const drug = await loadDrug(ing).catch(() => null);
      if (drug) loaded.push({ name: drugName(drug.slug, drug.name, lang), drug });
    }
  }
  if (!loaded.length) return null;
  const s = buildSummary(profile, loaded, t, lang);
  const section = (title: string, items: SummaryItem[]) => items.length > 0 && (
    <div>
      <h3 className="eyebrow mb-3">{title}</h3>
      <ul className="space-y-4">{items.map((x, i) => <Item key={i} x={x} t={t} />)}</ul>
    </div>
  );

  return (
    <section className="rounded-2xl border border-line bg-card p-6 sm:p-8 space-y-8" aria-labelledby="summary-title">
      <header>
        <h2 id="summary-title" className="font-serif text-3xl sm:text-4xl text-deep">{S.title}</h2>
        <p className="mt-2">{S.intro}</p>
        <p className="mt-4 rounded-xl bg-amber-soft/70 px-4 py-3 text-sm"><b>{S.notConclusive.split(".")[0]}.</b>{S.notConclusive.slice(S.notConclusive.indexOf(".") + 1)}</p>
      </header>
      {s.top.length ? section(S.topTitle, s.top) : <p className="text-muted">{S.none}</p>}
      {section(S.labelTitle, s.label)}
      {section(S.signalTitle, s.signals)}
      {s.gaps.length > 0 && (
        <div>
          <h3 className="eyebrow mb-3">{S.gapTitle}</h3>
          <ul className="space-y-2">{s.gaps.map((g) => <li key={g} className="flex gap-3"><StatusDot s="unknown" /><span>{g}</span></li>)}</ul>
        </div>
      )}
      <p className="text-xs text-muted border-t border-line pt-4">{S.method}</p>
    </section>
  );
}
