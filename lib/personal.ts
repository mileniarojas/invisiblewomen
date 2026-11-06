// Matches a woman's profile against a medicine's study data and explains, row by row,
// whether women like her were included, limited, left out, or never recorded.
import type { DrugDetail } from "./types";
import type { Dict } from "./i18n";

export type Status = "excluded" | "limited" | "included" | "unknown";
export type PersonalRow = { status: Status; text: string };

export type ProfileLike = {
  birth_year: number;
  sex_at_birth: string;
  race_ethnicity: string[]; // canonical keys: black, white, asian, american_indian, pacific, mena, other, prefer_not, hispanic
  height_cm: number | null;
  weight_kg: number | null;
  pregnancy_status: string;
  breastfeeding: boolean;
  menopause_status: string;
  hormonal_contraception: boolean;
  hormone_therapy: boolean;
  kidney_or_liver_disease: boolean;
  conditions?: string[];
  smoking?: string;
  surgeries?: string[];
};

export const ageOf = (p: ProfileLike) => new Date().getFullYear() - p.birth_year;
export const bmiOf = (p: ProfileLike) =>
  p.height_cm && p.weight_kg ? Math.round((p.weight_kg / (p.height_cm / 100) ** 2) * 10) / 10 : null;

const RACE_BUCKET: Record<string, string> = {
  black: "Black / African American", white: "White", asian: "Asian",
  american_indian: "American Indian / Alaska Native", pacific: "Native Hawaiian / Pacific Islander",
};
/** Many studies with the rule → left out; a few → limited; none → nobody recorded it. */
const sev = (p: number | undefined): Status => ((p ?? 0) >= 10 ? "excluded" : (p ?? 0) > 0 ? "limited" : "unknown");
const ORDER: Record<Status, number> = { excluded: 0, limited: 1, unknown: 2, included: 3 };
const r = (x: number | undefined) => Math.round(x ?? 0);
const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);

export function personalRows(p: ProfileLike, d: DrugDetail, t: Dict): PersonalRow[] {
  const s = d.summary, ex = s.exclusionPct, rep = s.reporting, P = t.personal;
  const rows: PersonalRow[] = [];
  const age = ageOf(p);
  const bmi = bmiOf(p);

  if (s.pctFemale !== null) rows.push({ status: s.pctFemale < 40 ? "limited" : "included", text: P.women(s.pctFemale) });

  if (age >= 65) {
    const aged = d.trialList.filter((x) => x.pct65 !== null && x.n);
    const n = aged.reduce((a, x) => a + (x.n ?? 0), 0);
    const pct65 = n ? Math.round((aged.reduce((a, x) => a + (x.pct65! / 100) * (x.n ?? 0), 0) / n) * 1000) / 10 : null;
    rows.push({ status: r(ex.older_adults_excluded) >= 30 || (pct65 ?? 0) < 10 ? "limited" : "included", text: P.older(r(ex.older_adults_excluded), pct65) });
  }
  if (p.pregnancy_status === "pregnant") rows.push({ status: "excluded", text: P.pregnant(r(ex.pregnant_excluded)) });
  if (p.breastfeeding) rows.push({ status: "excluded", text: P.breastfeeding(r(ex.breastfeeding_excluded)) });

  const couldGetPregnant = p.sex_at_birth === "female" && age >= 15 && age <= 50 && p.menopause_status !== "post" && p.pregnancy_status !== "pregnant";
  if (couldGetPregnant && (ex.contraception_required || ex.childbearing_potential_excluded)) {
    rows.push({ status: (ex.childbearing_potential_excluded ?? 0) >= 10 ? "excluded" : "limited", text: P.childbearing(r(ex.contraception_required), r(ex.childbearing_potential_excluded)) });
  }
  if (p.hormonal_contraception) rows.push({ status: sev(ex.hormonal_contraception_excluded), text: P.bc(r(ex.hormonal_contraception_excluded)) });
  if (p.hormone_therapy) rows.push({ status: sev(ex.hormone_therapy_excluded), text: P.hrt(r(ex.hormone_therapy_excluded)) });

  if (bmi !== null && (bmi >= 30 || bmi < 18.5)) {
    rows.push((ex.bmi_limit ?? 0) > 0
      ? { status: "limited", text: P.weight(bmi, r(ex.bmi_limit)) }
      : { status: "unknown", text: P.weightUnknown(bmi, r(rep.bmi)) });
  }

  const raceTotal = Object.values(s.race).reduce((a, b) => a + b, 0);
  for (const key of p.race_ethnicity) {
    const bucket = RACE_BUCKET[key];
    if (!bucket) continue;
    const label = P.raceShort[key];
    if (rep.race < 50 || !raceTotal) rows.push({ status: "unknown", text: P.raceUnknown(label) });
    else {
      const share = pctOf(s.race[bucket] ?? 0, raceTotal);
      rows.push({ status: share < 10 ? "limited" : "included", text: P.race(label, share) });
    }
  }
  if (p.race_ethnicity.includes("hispanic")) {
    const tot = s.hispanic.yes + s.hispanic.no;
    rows.push(tot ? { status: pctOf(s.hispanic.yes, tot) < 10 ? "limited" : "included", text: P.hispanic(pctOf(s.hispanic.yes, tot)) }
      : { status: "unknown", text: P.raceUnknown(t.lang === "es" ? "hispana o latina" : "Hispanic or Latina") });
  }
  if (p.kidney_or_liver_disease && ex.kidney_liver_excluded) rows.push({ status: sev(ex.kidney_liver_excluded), text: P.kidney(r(ex.kidney_liver_excluded)) });
  const CONDITION_FLAG: Record<string, keyof typeof ex> = {
    heart: "heart_excluded", diabetes: "diabetes_excluded", seizures: "seizure_excluded", mental_health: "mental_health_excluded", cancer: "cancer_excluded",
  };
  for (const c of p.conditions ?? []) {
    const flag = CONDITION_FLAG[c];
    if (flag && ex[flag]) rows.push({ status: sev(ex[flag]), text: c === "mental_health" ? P.mentalHealth(r(ex[flag])) : P.conditionExcluded(P.condShort[c], r(ex[flag])) });
  }
  if (p.smoking === "current" && ex.smoker_excluded) rows.push({ status: sev(ex.smoker_excluded), text: P.smoker(r(ex.smoker_excluded)) });
  if (p.menopause_status === "peri" || p.menopause_status === "post") rows.push({ status: "unknown", text: P.menopause(r(rep.menopause)) });

  const bySex = r(rep.sexStratified);
  // For medicines tested (almost) only in women, "results by sex" isn't a meaningful gap.
  if ((s.pctFemale ?? 0) < 95) rows.push({ status: "unknown", text: bySex === 0 ? P.noBySex : P.fewBySex(bySex) });

  return rows.sort((a, b) => ORDER[a.status] - ORDER[b.status]);
}
