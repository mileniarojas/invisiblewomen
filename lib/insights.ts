import "server-only";
// Free, rules-based synthesis across a woman's medicines. It only ranks and restates facts that are
// already in the data (study records, FDA labels, FDA adverse-event analysis); it never generates claims.
import type { DrugDetail } from "./types";
import type { Dict, Lang } from "./i18n";
import { LABEL_NOTES } from "./labelNotes";
import { ageOf, personalRows, type PersonalRow, type ProfileLike } from "./personal";
import { REGION_LABEL, REGION_OF } from "./countries";

export type SummaryItem = PersonalRow & { med: string; trials?: number };
export type Summary = { top: SummaryItem[]; label: SummaryItem[]; signals: SummaryItem[]; gaps: string[]; needs: string[]; meds: { name: string; slug: string }[] };

export function buildSummary(profile: ProfileLike, meds: { name: string; drug: DrugDetail }[], t: Dict, lang: Lang): Summary {
  const S = t.summary;
  const withStudies = meds.filter((m) => m.drug.summary.trials > 0);

  // 1. Strongest "left out / limited" findings across all medicines.
  const top = withStudies
    .flatMap((m) => personalRows(profile, m.drug, t).map((row) => ({ ...row, med: m.name, trials: m.drug.summary.trials })))
    .filter((x) => x.status === "excluded" || x.status === "limited")
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 6);

  // 2. FDA label notes that match her situation (hand-checked medicines only).
  const age = ageOf(profile);
  const label: SummaryItem[] = [];
  for (const m of meds) {
    const note = LABEL_NOTES[m.drug.slug]?.[lang];
    if (!note) continue;
    const pick: string[] = [];
    if (profile.pregnancy_status === "pregnant" || profile.pregnancy_status === "trying") pick.push(note.pregnant);
    if (profile.breastfeeding) pick.push(note.breastfeeding);
    if (age >= 65) pick.push(note.older);
    if (note.women) pick.push(note.women);
    for (const text of pick) label.push({ status: "unknown", text, weight: 0, source: "label", med: m.name });
  }

  // 3. Side-effect signals: the strongest female-biased one per medicine (AwareDX, FDA reports).
  const signals = meds
    .map((m) => ({ m, adr: m.drug.femaleRisks[0] }))
    .filter(({ adr }) => adr && Math.exp(adr.logRor) >= 1.5)
    .sort((a, b) => b.adr!.logRor - a.adr!.logRor)
    .slice(0, 4)
    .map(({ m, adr }) => ({
      status: "limited" as const, weight: 0, source: "reports" as const, med: m.name,
      text: S.signal(m.name, t.events[adr!.event] ?? adr!.event, Math.exp(adr!.logRor).toFixed(1)),
    }));

  // 4. Gaps.
  const gaps: string[] = [];
  const noBySex = withStudies.filter((m) => m.drug.summary.reporting.sexStratified < 5 && (m.drug.pctFemale ?? 0) < 95).length;
  if (noBySex) gaps.push(S.noBySexAll(noBySex, withStudies.length));
  if (profile.residence_country || profile.birth_country || (profile.family_origins ?? []).length) gaps.push(S.ancestry);

  // 5. What still needs to be studied: her situation × each medicine, where the studies have nothing.
  const G = t.gaps;
  const needs: string[] = [];
  const regions = [...new Set((profile.family_origins ?? []).map((c) => REGION_OF[c]).filter(Boolean))];
  for (const m of withStudies) {
    const d = m.drug, s = d.summary;
    if ((s.pctFemale ?? 0) < 95 && s.reporting.sexStratified < 5) needs.push(G.women(m.name));
    if (profile.pregnancy_status === "pregnant" && !d.focus.pregnancy.some((x) => x.results)) needs.push(G.pregnant(m.name));
    if (profile.breastfeeding && !d.focus.breastfeeding.some((x) => x.results)) needs.push(G.breastfeeding(m.name));
    if (profile.hormonal_contraception) needs.push(G.bc(m.name));
    if (profile.hormone_therapy) needs.push(G.hrt(m.name));
    if ((profile.menopause_status === "peri" || profile.menopause_status === "post") && s.reporting.menopause === 0) needs.push(G.menopause(m.name));
    if (age >= 65 && (s.exclusionPct.older_adults_excluded ?? 0) >= 30) needs.push(G.older(m.name));
    for (const r of regions) if ((s.studiesWithLocations ?? 0) >= 3 && !(s.regionStudies?.[r])) needs.push(G.heritage(m.name, REGION_LABEL[r]));
  }

  const medsOut = [...new Map(meds.map((m) => [m.drug.slug, { name: m.name, slug: m.drug.slug }])).values()];
  return { top, label, signals, gaps, needs: [...new Set(needs)].slice(0, 10), meds: medsOut };
}
