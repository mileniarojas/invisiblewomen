import { getAdrIndex, getDrug } from "@/lib/data";
import { BRAND, FDA_REGISTRY_LIST, FEATURED, REGISTRY, drugName, featuredInfo } from "@/lib/featured";
import { LABEL_NOTES } from "@/lib/labelNotes";
import { getT } from "@/lib/i18n/server";
import { getViewer, supabaseServer } from "@/lib/supabase/server";
import { DrugExperience, type ExpCard } from "@/components/DrugExperience";

export async function generateMetadata() {
  return { title: (await getT()).t.nav.drugs };
}

export default async function DrugsPage() {
  const [{ lang }, adrs, v, sb] = await Promise.all([getT(), getAdrIndex(), getViewer(), supabaseServer()]);

  // How many members have shared about each medicine.
  const counts = new Map<string, number>();
  if (sb) {
    const { data } = await sb.from("experiences").select("drug_slug,user_id").limit(10000);
    const seen = new Set<string>();
    for (const r of data ?? []) {
      const k = `${r.drug_slug}|${r.user_id}`;
      if (seen.has(k)) continue;
      seen.add(k);
      counts.set(r.drug_slug, (counts.get(r.drug_slug) ?? 0) + 1);
    }
  }

  const common: ExpCard[] = [];
  for (const f of FEATURED) {
    const d = await getDrug(f.slug);
    if (!d) continue;
    const note = LABEL_NOTES[f.slug]?.[lang];
    common.push({
      slug: f.slug, name: drugName(f.slug, d.name, lang), brand: BRAND[f.slug], use: featuredInfo(f.slug, lang)?.use,
      note: note?.women ?? featuredInfo(f.slug, lang)?.why,
      f: d.femaleAdrs, m: d.maleAdrs,
      top: d.femaleRisks.slice(0, 3).map((r) => ({ event: r.event, x: Math.exp(r.logRor) })),
      pregnancy: note?.pregnant, registry: REGISTRY[f.slug], members: counts.get(f.slug) ?? 0, common: true,
    });
  }

  // Every medicine in the Columbia (AwareDX) study, for search. Drug classes are left out.
  const all: ExpCard[] = Object.entries(adrs)
    .filter(([, a]) => !a.isClass && a.femaleCount + a.maleCount > 0)
    .map(([slug, a]) => common.find((c) => c.slug === slug) ?? ({
      slug, name: a.name.toLowerCase(), f: a.femaleCount, m: a.maleCount,
      top: a.female.slice(0, 3).map((r) => ({ event: r.event, x: Math.exp(r.logRor) })),
      members: counts.get(slug) ?? 0, common: false,
    }))
    .sort((x, y) => x.name.localeCompare(y.name));

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <DrugExperience common={common} all={all} signedIn={!!v.user} fdaRegistryList={FDA_REGISTRY_LIST} />
    </div>
  );
}
