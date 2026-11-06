import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { getDrugIndex } from "@/lib/data";
import { drugName } from "@/lib/featured";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() { return { title: (await getT()).t.nav.community }; }

type Post = { id: string; drug_slug: string; body: string; side_effects: string[]; author_name: string; like_count: number; created_at: string; public_context: Record<string, string | boolean> };

export default async function Community({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const [{ t, lang }, sb, sp, index] = await Promise.all([getT(), supabaseServer(), searchParams, getDrugIndex()]);
  const C = t.communityPage;
  const sort = sp.sort === "new" ? "new" : "top";
  let posts: Post[] = [];
  if (sb) {
    let q = sb.from("experiences").select("id,drug_slug,body,side_effects,author_name,like_count,created_at,public_context").limit(50);
    q = sort === "top" ? q.order("like_count", { ascending: false }).order("created_at", { ascending: false }) : q.order("created_at", { ascending: false });
    posts = ((await q).data ?? []) as Post[];
  }
  const names = new Map(index.map((d) => [d.slug, drugName(d.slug, d.name, lang)]));

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-5xl">{C.title}</h1>
        <nav aria-label={C.sort} className="flex gap-2">
          {(["top", "new"] as const).map((s) => (
            <Link key={s} href={`/community?sort=${s}`} aria-current={sort === s ? "page" : undefined}
              className={`btn !min-h-[40px] !py-1.5 ${sort === s ? "btn-primary" : "btn-outline"}`}>{C[s]}</Link>
          ))}
        </nav>
      </div>

      {!sb ? <p className="text-muted mt-8">{C.notConnected}</p> : posts.length === 0 ? (
        <div className="card p-8 mt-8">
          <p className="text-lg">{C.empty}</p>
          <Link href="/drugs" className="btn btn-primary mt-5">{C.browse}</Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {posts.map((p) => {
            const title = p.body.split(/(?<=[.!?])\s|\n/)[0].slice(0, 110);
            return (
              <li key={p.id} className="card grid grid-cols-[4.5rem_1fr] overflow-hidden">
                <div className="border-r border-line flex flex-col items-center justify-center gap-1 py-5 font-bold">
                  <span aria-hidden>▲</span><span>{p.like_count}</span>
                </div>
                <Link href={`/drugs/${p.drug_slug}#you`} className="p-5 sm:p-6 block hover:bg-paper/60">
                  <h2 className="font-serif text-2xl">{title}</h2>
                  <p className="text-muted mt-1">{p.author_name} · {new Date(p.created_at).toLocaleDateString(lang === "es" ? "es-US" : "en-US")}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="tag capitalize">{names.get(p.drug_slug) ?? p.drug_slug.replace(/-/g, " ")}</span>
                    <span className="tag tag-berry">{p.public_context?.pregnant ? C.pregnant : C.notPregnant}</span>
                    {p.side_effects.slice(0, 4).map((s) => <span key={s} className="tag tag-teal">{s}</span>)}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-muted mt-8">{C.comments}</p>
    </div>
  );
}
