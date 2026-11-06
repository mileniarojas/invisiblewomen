"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/client";

export type ExpCard = {
  slug: string; name: string; brand?: string; use?: string; note?: string;
  f: number; m: number; top: { event: string; x: number }[];
  pregnancy?: string; registry?: { name: string; url: string }; members: number; common: boolean;
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Drug experience": pick the medicines you take (common ones or any of the AwareDX list) and see each one. */
export function DrugExperience({ common, all, signedIn, fdaRegistryList }: { common: ExpCard[]; all: ExpCard[]; signedIn: boolean; fdaRegistryList: string }) {
  const t = useT(), D = t.drugExp;
  const bySlug = useMemo(() => new Map([...all, ...common].map((c) => [c.slug, c])), [all, common]);
  const byName = useMemo(() => new Map(all.map((c) => [c.name.toLowerCase(), c.slug])), [all]);
  const [picked, setPicked] = useState<string[]>([common[common.length - 1]?.slug ?? common[0]?.slug].filter(Boolean));
  const [extra, setExtra] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const toggle = (slug: string) => setPicked((p) => (p.includes(slug) ? p.filter((x) => x !== slug) : [...p, slug]));
  const add = () => {
    const slug = byName.get(q.trim().toLowerCase());
    if (!slug) return;
    if (!common.some((c) => c.slug === slug) && !extra.includes(slug)) setExtra((e) => [...e, slug]);
    setPicked((p) => (p.includes(slug) ? p : [...p, slug]));
    setQ("");
  };
  const pills = [...common.map((c) => c.slug), ...extra];

  return (
    <div>
      <h1 className="font-serif text-5xl sm:text-6xl">{D.title}</h1>
      <p className="text-lg text-muted mt-3 max-w-3xl leading-relaxed">
        {D.intro(all.length)} <a href={D.sources[0][1]} target="_blank" rel="noreferrer" className="text-sm font-bold text-plum underline align-super">1</a>
      </p>

      <form className="mt-6 flex gap-3 max-w-xl" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <label htmlFor="med-search" className="sr-only">{D.searchPh(all.length)}</label>
        <input id="med-search" list="all-meds" value={q} onChange={(e) => setQ(e.target.value)} placeholder={D.searchPh(all.length)} className="input !rounded-full !px-5" autoComplete="off" />
        <datalist id="all-meds">{all.map((c) => <option key={c.slug} value={c.name} />)}</datalist>
        <button className="btn btn-outline">{D.add}</button>
      </form>

      <div role="group" aria-label={D.medicines} className="flex flex-wrap gap-2.5 mt-5">
        {pills.map((slug) => {
          const c = bySlug.get(slug)!;
          return (
            <button key={slug} type="button" role="checkbox" aria-checked={picked.includes(slug)} aria-selected={picked.includes(slug)} onClick={() => toggle(slug)} className="pill-tab capitalize">{c.name}</button>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl bg-rose-soft px-6 py-5 flex flex-wrap items-center justify-between gap-4">
        <p className="text-lg"><b>{D.browsing}</b> {D.browsingRest}</p>
        <Link href={signedIn ? "/my" : "/login"} className="btn !bg-rose !border-rose !text-white">{signedIn ? D.seeMine : t.nav.join}</Link>
      </div>

      <div className="mt-6 space-y-6">
        {picked.map((slug) => {
          const c = bySlug.get(slug);
          if (!c) return null;
          const total = c.f + c.m;
          const maxX = Math.max(...c.top.map((x) => x.x), 1.01);
          return (
            <article key={slug} className="card p-6 sm:p-8">
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-serif text-3xl sm:text-4xl capitalize">{c.name}{c.brand && <span className="text-muted"> ({c.brand})</span>}</h2>
                  {c.use && <p className="text-muted mt-1">{c.use}</p>}
                </div>
                <button type="button" onClick={() => toggle(slug)} className="text-muted hover:text-rose text-sm" aria-label={`${D.remove} ${c.name}`}>✕</button>
              </header>
              {c.note && <p className="mt-4 text-lg leading-relaxed max-w-3xl">{c.note}</p>}

              {total > 0 && (
                <div className="mt-5 max-w-md">
                  <div className="flex h-3 rounded-full overflow-hidden bg-men" aria-hidden><div className="bg-rose" style={{ width: `${Math.round((c.f / total) * 100)}%` }} /></div>
                  <p className="mt-2 text-sm"><b className="text-rose-text">{D.split(c.f, c.m)[0]}</b>{D.split(c.f, c.m)[1]}</p>
                </div>
              )}

              {c.top.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-serif text-xl mb-3">{D.mostWomen}</h3>
                  <ul className="space-y-2.5">
                    {c.top.map((e) => (
                      <li key={e.event} className="grid grid-cols-[minmax(0,13rem)_1fr] sm:grid-cols-[minmax(0,16rem)_1fr] gap-4 items-center">
                        <span className="text-[.95rem] leading-snug">{t.events[e.event] ?? e.event}</span>
                        <span className="h-3 rounded-full bg-line overflow-hidden"><span className="block h-full rounded-full bg-rose" style={{ width: `${Math.round(((e.x - 1) / (maxX - 1)) * 85) + 15}%` }} /></span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {c.pregnancy && (
                <p className="mt-6 rounded-xl border-l-4 border-plum bg-plum-soft px-5 py-4 leading-relaxed">
                  <b>{D.pregnancy}</b> {c.pregnancy}{" "}
                  {D.registry} <a href={c.registry?.url ?? fdaRegistryList} target="_blank" rel="noreferrer" className="underline text-plum">{c.registry?.name ?? D.registryFallback}</a>.
                </p>
              )}

              <div className="mt-6 pt-5 border-t border-line flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-serif text-lg">{D.members(cap(c.name), c.members)}</p>
                  {signedIn
                    ? <Link href={`/drugs/${slug}#share`} className="underline text-plum">{D.shareIn(c.name)}</Link>
                    : <p className="text-muted"><Link href="/login" className="underline text-plum">{D.shareLink}</Link>{D.shareRest(c.name)}</p>}
                </div>
                <Link href={`/drugs/${slug}`} className="btn btn-primary">{D.full}</Link>
              </div>
            </article>
          );
        })}
      </div>

      <details className="mt-10 border-t border-line pt-5">
        <summary className="cursor-pointer font-bold"><span className="text-rose">+</span> {D.sourcesTitle}</summary>
        <ol className="list-decimal pl-6 mt-3 space-y-2 text-muted">
          {D.sources.map(([text, href]) => <li key={href}><a href={href} target="_blank" rel="noreferrer" className="underline">{text}</a></li>)}
        </ol>
        <p className="text-sm text-muted mt-4">{D.signalNote}</p>
      </details>
    </div>
  );
}
