"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import { postExperience, toggleLike, toggleSave, deleteExperience, reportExperience } from "@/app/drugs/[slug]/actions";

export type Experience = {
  id: string; user_id: string; body: string; side_effects: string[]; severity: number | null; duration: string | null;
  public_context: Record<string, string | boolean>; author_name: string; like_count: number; created_at: string;
};
type ViewerState = "unconfigured" | "guest" | "incomplete" | "ready";

function GateNotice({ state }: { state: ViewerState }) {
  const t = useT().community;
  if (state === "unconfigured") return <p className="text-sm text-muted">{t.unconfigured}</p>;
  if (state === "guest") return <p className="text-sm"><Link href="/login" className="font-semibold text-rose underline">{t.guest1}</Link>{t.guest2}</p>;
  return <p className="text-sm"><Link href="/onboarding" className="font-semibold text-rose underline">{t.incomplete}</Link>{t.incomplete2}</p>;
}

export function SaveButton({ slug, saved: initial, state }: { slug: string; saved: boolean; state: ViewerState }) {
  const t = useT().community;
  const [saved, setSaved] = useState(initial);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  if (state !== "ready") {
    return <Link href={state === "guest" ? "/login" : "/onboarding"} className="btn btn-ghost">{t.save}</Link>;
  }
  return (
    <span>
      <button className="btn btn-ghost" disabled={pending} aria-pressed={saved}
        onClick={() => start(async () => { const r = await toggleSave(slug, saved); if (r.ok) setSaved(!saved); else setErr(t.errors[r.error] ?? r.error); })}>
        {saved ? t.saved : t.save}
      </button>
      {err && <span className="text-xs text-rose ml-2">{err}</span>}
    </span>
  );
}


function ContextChips({ c }: { c: Record<string, string | boolean> }) {
  const t = useT().community.chips;
  const chips: string[] = [];
  if (c.age_band) chips.push(t.age(String(c.age_band)));
  if (c.pregnant) chips.push(t.pregnant);
  if (c.breastfeeding) chips.push(t.breastfeeding);
  if (c.menopause === "pre" || c.menopause === "peri" || c.menopause === "post") chips.push(t[c.menopause]);
  if (c.hormonal_bc) chips.push(t.bc);
  if (c.hrt) chips.push(t.hrt);
  if (c.race) chips.push(String(c.race));
  if (c.other_meds) chips.push(t.meds(String(c.other_meds)));
  return <>{chips.map((x) => <span key={x} className="chip bg-plum-soft text-ink">{x}</span>)}</>;
}

export function ExperienceFeed({ slug, items, likedIds, state, viewerId }: { slug: string; items: Experience[]; likedIds: string[]; state: ViewerState; viewerId: string | null }) {
  const t = useT().community;
  const msg = (e: string) => t.errors[e] ?? e;
  const [liked, setLiked] = useState(new Set(likedIds));
  const [counts, setCounts] = useState(Object.fromEntries(items.map((i) => [i.id, i.like_count])));
  const [reported, setReported] = useState(new Set<string>());
  const [, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {state === "ready" ? <ExperienceForm slug={slug} /> : <div className="card p-5"><GateNotice state={state} /></div>}
      {err && <p className="text-sm text-rose">{err}</p>}
      {items.length === 0 && <p className="text-muted">{t.none}</p>}
      {items.map((e) => {
        const isLiked = liked.has(e.id);
        return (
          <article key={e.id} className="card p-5">
            <header className="flex flex-wrap items-center gap-2 mb-2">
              <b>{e.author_name}</b>
              <ContextChips c={e.public_context} />
              <time className="text-xs text-muted ml-auto">{new Date(e.created_at).toLocaleDateString()}</time>
            </header>
            <p className="whitespace-pre-line">{e.body}</p>
            <div className="flex flex-wrap gap-2 mt-3 text-xs">
              {e.severity ? <span className="chip bg-amber-soft text-ink">{t.severity[e.severity]}</span> : null}
              {e.duration && <span className="chip bg-line/60">{e.duration}</span>}
              {e.side_effects.map((s) => <span key={s} className="chip bg-rose-soft text-rose">{s}</span>)}
            </div>
            <footer className="flex items-center gap-3 mt-4 text-sm">
              {state === "ready" ? (
                <button className={`btn !py-1 ${isLiked ? "bg-rose-soft text-rose" : "btn-ghost"}`} aria-pressed={isLiked}
                  onClick={() => start(async () => {
                    const r = await toggleLike(slug, e.id, isLiked);
                    if (!r.ok) return setErr(msg(r.error));
                    const n = new Set(liked); isLiked ? n.delete(e.id) : n.add(e.id); setLiked(n);
                    setCounts({ ...counts, [e.id]: counts[e.id] + (isLiked ? -1 : 1) });
                  })}>
                  ♥ {counts[e.id]} {isLiked ? t.liked : t.helpful}
                </button>
              ) : <span className="text-muted">♥ {counts[e.id]}</span>}
              {viewerId === e.user_id ? (
                <button className="text-muted hover:text-rose ml-auto" onClick={() => confirm(t.confirmDelete) && start(async () => { const r = await deleteExperience(slug, e.id); if (!r.ok) setErr(msg(r.error)); })}>{t.del}</button>
              ) : state === "ready" && (
                <button className="text-muted hover:text-rose ml-auto" disabled={reported.has(e.id)}
                  onClick={() => start(async () => { const r = await reportExperience(slug, e.id); if (r.ok) setReported(new Set(reported).add(e.id)); else setErr(msg(r.error)); })}>
                  {reported.has(e.id) ? t.reported : t.report}
                </button>
              )}
            </footer>
          </article>
        );
      })}
    </div>
  );
}

function ExperienceForm({ slug }: { slug: string }) {
  const t = useT().community;
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <form className="card p-5 space-y-4" action={(fd) => start(async () => {
      const r = await postExperience(slug, fd);
      setMsg(r.ok ? { ok: true, text: t.thanks } : { ok: false, text: t.errors[r.error] ?? r.error });
    })}>
      <h3 className="font-serif text-xl">{t.formTitle}</h3>
      <textarea name="body" required minLength={10} maxLength={4000} rows={4} className="input" placeholder={t.bodyPh} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div><label className="label" htmlFor="se">{t.sideEffects}</label><input id="se" name="side_effects" className="input" placeholder={t.sidePh} /></div>
        <div><label className="label" htmlFor="sev">{t.howBad}</label>
          <select id="sev" name="severity" className="input" defaultValue=""><option value="">—</option>{t.severity.slice(1).map((x, i) => <option key={x} value={i + 1}>{x}</option>)}</select></div>
        <div><label className="label" htmlFor="dur">{t.howLong}</label><input id="dur" name="duration" className="input" placeholder={t.howLongPh} /></div>
      </div>
      <fieldset className="text-sm">
        <legend className="label">{t.show}</legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <label className="flex gap-2"><input type="checkbox" name="share_age" defaultChecked /> {t.shareAge}</label>
          <label className="flex gap-2"><input type="checkbox" name="share_repro" defaultChecked /> {t.shareRepro}</label>
          <label className="flex gap-2"><input type="checkbox" name="share_race" /> {t.shareRace}</label>
          <label className="flex gap-2"><input type="checkbox" name="share_meds" /> {t.shareMeds}</label>
        </div>
      </fieldset>
      <div className="flex items-center gap-3">
        <button className="btn btn-primary" disabled={pending}>{pending ? t.posting : t.post}</button>
        {msg && <span className={`text-sm ${msg.ok ? "text-sage" : "text-rose"}`}>{msg.text}</span>}
      </div>
      <p className="text-xs text-muted">{t.disclaimer}</p>
    </form>
  );
}
