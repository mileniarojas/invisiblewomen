import Link from "next/link";
import { notFound } from "next/navigation";
import { loadDrug } from "@/lib/live";
import { drugName, featuredInfo } from "@/lib/featured";
import { getViewer } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { LABEL_NOTES } from "@/lib/labelNotes";
import { ExclusionList, MissingDataChecklist, TrialTable, WhoWasInTrials } from "@/components/TrialSections";
import { buildGroups } from "@/components/GroupBreakdown";
import { GroupTabs } from "@/components/GroupTabs";
import { SideEffects } from "@/components/SideEffects";
import { ExperienceFeed, SaveButton, type Experience } from "@/components/Community";
import { InteractionPanel } from "@/components/InteractionPanel";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [d, { lang }] = await Promise.all([loadDrug(slug).catch(() => null), getT()]);
  if (!d) return { title: "—" };
  const name = drugName(slug, d.name, lang);
  return { title: name[0].toUpperCase() + name.slice(1) };
}

function Detail({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group border-b border-line">
      <summary className="flex items-center justify-between cursor-pointer py-5 font-serif text-xl text-deep list-none">
        {title}<span className="text-rose text-2xl transition group-open:rotate-45" aria-hidden>+</span>
      </summary>
      <div className="pb-8">{children}</div>
    </details>
  );
}

export default async function DrugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [drug, { t, lang }, v] = await Promise.all([loadDrug(slug).catch(() => null), getT(), getViewer()]);
  if (!drug) notFound();
  const info = featuredInfo(slug, lang);
  const name = drugName(slug, drug.name, lang);
  const state = !v.sb ? "unconfigured" : !v.user ? "guest" : !v.complete ? "incomplete" : "ready";
  const d2 = t.drug2;

  let experiences: Experience[] = [];
  let likedIds: string[] = [];
  let saved = false;
  if (v.sb) {
    const { data } = await v.sb.from("experiences").select("*").eq("drug_slug", slug).order("like_count", { ascending: false }).order("created_at", { ascending: false }).limit(50);
    experiences = (data ?? []) as Experience[];
    if (v.user && experiences.length) {
      const { data: l } = await v.sb.from("likes").select("experience_id").eq("user_id", v.user.id).in("experience_id", experiences.map((e) => e.id));
      likedIds = (l ?? []).map((x) => x.experience_id);
    }
    if (v.user) {
      const { data: s } = await v.sb.from("saves").select("drug_slug").eq("user_id", v.user.id).eq("drug_slug", slug).maybeSingle();
      saved = !!s;
    }
  }

  const s = drug.summary;
  const stats: [string, string][] = [
    [`${s.pctFemale ?? "—"}%`, t.drug.statWomen],
    [`${Math.round(s.exclusionPct.pregnant_excluded ?? 0)}%`, t.drug.statPregnant],
    [`${Math.round(s.reporting.sexStratified)}%`, t.drug.statBySex],
  ];
  const groups = buildGroups(drug, t, lang).map(({ ...g }) => ({ ...g, known: g.label ? [] : g.known }));
  const womenNote = LABEL_NOTES[slug]?.[lang]?.women;

  return (
    <article>
      {/* Hero */}
      <section className="bg-paper">
        <div className="mx-auto max-w-5xl px-4 pt-8 pb-14">
          <div className="flex items-center justify-between gap-4">
            <Link href="/drugs" className="text-sm text-muted hover:text-ink">{t.drug.back}</Link>
            <SaveButton slug={slug} saved={saved} state={state} />
          </div>
          <p className="eyebrow mt-8">{info?.use}</p>
          <h1 className="font-serif text-5xl sm:text-7xl capitalize text-deep mt-2">{name}</h1>
          {info ? <p className="mt-5 text-xl leading-relaxed max-w-2xl">{info.why}</p> : drug.live && <p className="mt-5 text-lg leading-relaxed max-w-2xl">{t.drug2.liveNote}</p>}
          <ul className="grid gap-4 sm:grid-cols-3 mt-10">
            {stats.map(([n, l]) => (
              <li key={l} className="rounded-xl bg-rose-soft/70 p-6 text-center">
                <div className="font-serif text-5xl text-deep">{n}</div>
                <p className="text-sm mt-2">{l}</p>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <a href="#like-me" className="btn btn-primary btn-lg">{d2.likeMe}</a>
            <a href="#you" className="link-cta text-deep">{d2.checkMine}</a>
          </div>
        </div>
      </section>

      {/* Was someone like me tested? */}
      <section id="like-me" className="mx-auto max-w-5xl px-4 py-16 scroll-mt-20">
        <h2 className="font-serif text-4xl sm:text-5xl text-deep text-center">{d2.likeMe}</h2>
        <p className="text-center text-muted mt-3 mb-8">{d2.likeMeSub}</p>
        <p className="text-center text-sm font-semibold text-rose mb-6">{t.groups.noResultsBySex}</p>
        <GroupTabs groups={groups} />
      </section>

      {/* Good to know band */}
      {womenNote && (
        <section className="bg-rose-soft">
          <div className="mx-auto max-w-3xl px-4 py-14 text-center">
            <p className="eyebrow mb-3">{d2.goodToKnow}</p>
            <p className="text-xl sm:text-2xl leading-relaxed text-deep">{womenNote}</p>
          </div>
        </section>
      )}

      {/* Side effects */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="font-serif text-4xl text-deep text-center">{d2.sideTitle}</h2>
        <p className="text-center text-muted mt-3 mb-8">{d2.sideSub}</p>
        <SideEffects risks={drug.femaleRisks} />
      </section>

      {/* Make it about you */}
      <section id="you" className="bg-paper scroll-mt-20">
        <div className="mx-auto max-w-5xl px-4 py-16 space-y-10">
          <h2 className="font-serif text-4xl text-deep text-center">{d2.youTitle}</h2>
          <div>
            <h3 className="font-serif text-2xl text-deep mb-4">{t.drug.interactions}</h3>
            <InteractionPanel slug={slug} drugName={name} state={state} medNames={v.meds.map((m) => m.name)} />
          </div>
          <div>
            <h3 className="font-serif text-2xl text-deep mb-4">{t.drug.experiences}</h3>
            <ExperienceFeed slug={slug} items={experiences} likedIds={likedIds} state={state} viewerId={v.user?.id ?? null} />
          </div>
        </div>
      </section>

      {/* All the details */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="font-serif text-4xl text-deep">{d2.detailsTitle}</h2>
        <p className="text-muted mt-2 mb-4">{d2.detailsSub}</p>
        <div className="border-t border-line">
          <Detail title={t.drug.who}><WhoWasInTrials drug={drug} t={t} /></Detail>
          <Detail title={t.drug.leftOut}><p className="text-sm text-muted mb-4">{t.drug.leftOutIntro}</p><ExclusionList drug={drug} t={t} /></Detail>
          <Detail title={t.drug.missing}><p className="text-sm text-muted mb-4">{t.drug.missingIntro}</p><MissingDataChecklist drug={drug} t={t} /></Detail>
          <Detail title={t.drug.allTrials(s.trials)}><TrialTable trials={drug.trialList} t={t} live={drug.live} /></Detail>
        </div>
      </section>
    </article>
  );
}
