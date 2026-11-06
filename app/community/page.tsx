import Link from "next/link";
import { getViewer } from "@/lib/supabase/server";
import { getDrugIndex } from "@/lib/data";
import { FEATURED, drugName } from "@/lib/featured";
import { getT } from "@/lib/i18n/server";
import { CommunityStats, type MedReports } from "@/components/CommunityStats";

export async function generateMetadata() { return { title: (await getT()).t.nav.community }; }

type Post = { id: string; user_id: string; drug_slug: string; body: string; side_effects: string[]; author_name: string; like_count: number; created_at: string; public_context: Record<string, string | boolean> };

export default async function Community({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const [{ t, lang }, v, sp, index] = await Promise.all([getT(), getViewer(), searchParams, getDrugIndex()]);
  const C = t.communityPage;
  const sb = v.sb;
  const sort = sp.sort === "new" ? "new" : "top";
  const names = new Map(index.map((d) => [d.slug, drugName(d.slug, d.name, lang)]));
  const nameOf = (slug: string) => names.get(slug) ?? slug.replace(/-/g, " ");

  let all: Post[] = [];
  if (sb) {
    const { data } = await sb.from("experiences").select("id,user_id,drug_slug,body,side_effects,author_name,like_count,created_at,public_context").limit(5000);
    all = (data ?? []) as Post[];
  }

  // Member reports per medicine. Members get anonymous numbers, so no account ids reach the browser.
  const anon = new Map<string, number>();
  const idOf = (u: string) => { if (!anon.has(u)) anon.set(u, anon.size + 1); return anon.get(u)!; };
  const perMed = new Map<string, Map<number, Set<string>>>();
  for (const p of all) {
    const m = perMed.get(p.drug_slug) ?? new Map<number, Set<string>>();
    const set = m.get(idOf(p.user_id)) ?? new Set<string>();
    for (const e of p.side_effects ?? []) if (e.trim()) set.add(e.trim().toLowerCase());
    m.set(idOf(p.user_id), set);
    perMed.set(p.drug_slug, m);
  }
  const slugs = [...new Set([...FEATURED.map((f) => f.slug), ...perMed.keys()])];
  const meds: MedReports[] = slugs.map((slug) => ({
    slug, name: nameOf(slug),
    members: [...(perMed.get(slug) ?? new Map()).entries()].map(([id, set]) => ({ id, effects: [...set] })),
  }));

  const posts = [...all].sort((a, b) => (sort === "top" ? b.like_count - a.like_count : 0) || +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 50);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <h1 className="font-serif text-5xl text-deep">{C.heading}</h1>
      <p className="text-lg text-muted mt-2">{C.sub}</p>

      {!sb ? <p className="text-muted mt-8">{C.notConnected}</p> : (
        <>
          <div className="mt-8"><CommunityStats meds={meds} total={all.length} /></div>

          {!v.user && (
            <div className="mt-6 rounded-2xl bg-rose-soft px-6 py-5 flex flex-wrap items-center justify-between gap-4">
              <p className="text-lg"><b>{C.reading}</b> {C.readingRest}</p>
              <Link href="/login" className="btn btn-primary">{t.nav.join}</Link>
            </div>
          )}

          <div className="mt-12 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-serif text-4xl text-deep">{C.title}</h2>
            <nav aria-label={C.sort} className="flex items-center gap-2">
              <span className="text-sm text-muted mr-1">{C.sort}</span>
              {(["top", "new"] as const).map((s) => (
                <Link key={s} href={`/community?sort=${s}`} aria-current={sort === s ? "page" : undefined}
                  className={`btn !py-1.5 !px-4 ${sort === s ? "btn-primary" : "btn-ghost"}`}>{C[s]}</Link>
              ))}
            </nav>
          </div>

          {posts.length === 0 ? (
            <div className="card p-8 mt-6">
              <p className="text-lg">{C.empty}</p>
              <Link href="/drugs" className="btn btn-primary mt-5">{C.browse}</Link>
            </div>
          ) : (
            <ul className="mt-6 space-y-4">
              {posts.map((p) => {
                const title = p.body.split(/(?<=[.!?])\s|\n/)[0].slice(0, 110);
                return (
                  <li key={p.id} className="card grid grid-cols-[4.5rem_1fr] overflow-hidden">
                    <div className="border-r border-line flex flex-col items-center justify-center gap-1 py-5 font-bold">
                      <span aria-hidden>▲</span><span>{p.like_count}</span>
                    </div>
                    <Link href={`/drugs/${p.drug_slug}#share`} className="p-5 sm:p-6 block hover:bg-paper/60">
                      <h3 className="font-serif text-2xl">{title}</h3>
                      <p className="text-muted mt-1">{p.author_name} · {new Date(p.created_at).toLocaleDateString(lang === "es" ? "es-US" : "en-US")}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="tag capitalize">{nameOf(p.drug_slug)}</span>
                        <span className="tag tag-berry">{p.public_context?.pregnant ? C.pregnant : C.notPregnant}</span>
                        {p.side_effects.slice(0, 4).map((s) => <span key={s} className="tag tag-teal">{s}</span>)}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
      <p className="text-muted mt-8">{C.comments}</p>
    </div>
  );
}
