import type { DrugDetail, FocusTrial } from "@/lib/types";
import type { Dict, Lang } from "@/lib/i18n";
import { LABEL_NOTES } from "@/lib/labelNotes";

import type { GroupView as Group } from "./GroupTabs";

const r = (x: number | undefined) => Math.round(x ?? 0);
const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : null);

export function buildGroups(drug: DrugDetail, t: Dict, lang: Lang): Group[] {
  const s = drug.summary, ex = s.exclusionPct, rep = s.reporting, g = t.groups;
  const note = LABEL_NOTES[drug.slug]?.[lang];
  const none = g.nothingKnown;

  const preg = drug.focus.pregnancy, bf = drug.focus.breastfeeding, meno = drug.focus.menopause, uses = drug.focus.womenUses;
  const pregN = preg.reduce((a, x) => a + (x.n ?? 0), 0);

  const aged = drug.trialList.filter((x) => x.pct65 !== null && x.n);
  const agedN = aged.reduce((a, x) => a + (x.n ?? 0), 0);
  const pct65 = agedN ? Math.round(aged.reduce((a, x) => a + (x.pct65! / 100) * (x.n ?? 0), 0) / agedN * 1000) / 10 : null;

  const raceTotal = Object.values(s.race).reduce((a, b) => a + b, 0);
  const ethTotal = s.hispanic.yes + s.hispanic.no;

  const groups: Group[] = [
    {
      key: "pregnant", title: g.pregnant.title,
      verdict: preg.some((x) => x.results) ? "barely" : "no",
      studied: g.pregnant.studied(r(ex.pregnant_excluded), preg.length, pregN),
      known: note?.pregnant ? [] : [none], label: note?.pregnant, trials: preg,
    },
    {
      key: "breastfeeding", title: g.breastfeeding.title,
      verdict: bf.some((x) => x.results) ? "barely" : "no",
      studied: g.breastfeeding.studied(r(ex.breastfeeding_excluded), bf.length),
      known: note?.breastfeeding ? [] : [none], label: note?.breastfeeding, trials: bf,
    },
    {
      key: "childbearing", title: g.childbearing.title,
      verdict: (ex.childbearing_potential_excluded ?? 0) > 10 ? "barely" : "partly",
      studied: g.childbearing.studied(r(ex.contraception_required), r(ex.childbearing_potential_excluded), r(ex.postmenopausal_only)),
      known: [none],
    },
    {
      key: "birthControl", title: g.birthControl.title, verdict: "unknown",
      studied: g.birthControl.studied(r(ex.hormonal_contraception_excluded), r(ex.hormone_therapy_excluded)),
      known: [none],
    },
    {
      key: "older", title: g.older.title,
      verdict: pct65 === null ? "unknown" : pct65 >= 30 ? "yes" : pct65 >= 10 ? "partly" : "barely",
      studied: g.older.studied(r(ex.older_adults_excluded), pct65),
      known: note?.older ? [] : [none], label: note?.older,
    },
    {
      key: "color", title: g.color.title,
      verdict: rep.race < 50 ? "unknown" : "partly",
      studied: g.color.studied(r(rep.race),
        raceTotal ? pctOf(s.race["Black / African American"] ?? 0, raceTotal) : null,
        raceTotal ? pctOf(s.race["Asian"] ?? 0, raceTotal) : null,
        ethTotal ? pctOf(s.hispanic.yes, ethTotal) : null),
      known: note?.color ? [] : [none], label: note?.color,
    },
    {
      key: "weight", title: g.weight.title,
      verdict: rep.bmi < 25 ? "unknown" : "partly",
      studied: g.weight.studied(r(ex.bmi_limit), r(rep.bmi)),
      known: [none],
    },
    {
      key: "menopause", title: g.menopause.title,
      verdict: rep.menopause > 0 ? "partly" : meno.length ? "barely" : "no",
      studied: g.menopause.studied(r(rep.menopause), meno.length),
      known: [none], trials: meno,
    },
  ];
  if (uses.length >= 2) {
    groups.push({
      key: "womenUses", title: g.womenUses.title, verdict: uses.some((x) => x.results) ? "partly" : "barely",
      studied: g.womenUses.studied(uses.length, uses.filter((x) => x.results).length), known: [], trials: uses,
    });
  }
  return groups;
}

