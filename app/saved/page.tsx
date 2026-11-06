import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/supabase/server";
import { getDrugIndex } from "@/lib/data";
import { getT } from "@/lib/i18n/server";
import { drugName } from "@/lib/featured";

export async function generateMetadata() { return { title: (await getT()).t.savedPage.title }; }

export default async function Saved() {
  const [v, { t, lang }] = await Promise.all([getViewer(), getT()]);
  if (!v.user || !v.sb) redirect("/login");
  const { data } = await v.sb.from("saves").select("drug_slug,created_at").eq("user_id", v.user.id).order("created_at", { ascending: false });
  const index = new Map((await getDrugIndex()).map((d) => [d.slug, d]));
  const drugs = (data ?? []).map((s) => index.get(s.drug_slug)).filter((d) => !!d);
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif text-4xl mb-6">{t.savedPage.title}</h1>
      {drugs.length === 0 ? <p className="text-muted">{t.savedPage.none}</p> : (
        <ul className="grid gap-2">{drugs.map((d) => (
          <li key={d.slug}><Link href={`/drugs/${d.slug}`} className="card p-4 flex gap-3 items-center hover:border-rose">
            <b className="capitalize flex-1 font-serif text-lg">{drugName(d.slug, d.name, lang)}</b>
            <span className="text-sm text-rose">{t.home.womenInTrials(d.pctFemale ?? 0)}</span>
          </Link></li>
        ))}</ul>
      )}
    </div>
  );
}
