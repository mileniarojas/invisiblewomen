import { getDrugIndex } from "@/lib/data";
import { CATEGORY, FEATURED, drugName, featuredInfo } from "@/lib/featured";
import { getT } from "@/lib/i18n/server";
import { MedicineGrid } from "@/components/MedicineGrid";

export async function generateMetadata() {
  return { title: (await getT()).t.drugsPage.title };
}

export default async function DrugsPage() {
  const [{ t, lang }, index] = await Promise.all([getT(), getDrugIndex()]);
  const bySlug = new Map(index.map((d) => [d.slug, d]));
  const items = FEATURED.map((f) => {
    const d = bySlug.get(f.slug)!;
    return { slug: f.slug, name: drugName(f.slug, d.name, lang), use: featuredInfo(f.slug, lang)!.use, pct: d.pctFemale ?? 0, cat: CATEGORY[f.slug] };
  });
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-serif text-5xl text-center text-deep">{t.drugsPage.title}</h1>
      <p className="text-center text-muted mt-3 mb-10 max-w-2xl mx-auto">{t.drugsPage.intro}</p>
      <MedicineGrid items={items} />
    </div>
  );
}
