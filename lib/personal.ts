// Matches a woman's profile against a medicine's study data and explains, row by row,
// whether women like her were included, limited, left out, or never recorded.
// Every row is computed from the data — nothing is estimated or invented — and rows that come
// from an eligibility rule carry an example study and the rule's exact wording as evidence.
import type { DrugDetail } from "./types";
import type { Dict } from "./i18n";
import type { ExclusionFlag } from "./exclusions";
import { REGION_LABEL, REGION_OF, countryInSentence } from "./countries";

export type Status = "excluded" | "limited" | "included" | "unknown";
export type Evidence = { nct: string; quote: string; live?: boolean };
export type PersonalRow = {
  status: Status;
  text: string;
  /** 0–100, how strongly this applies (share of studies with the rule, etc.); used for ranking */
  weight: number;
  source: "studies" | "label" | "reports";
  evidence?: Evidence;
};

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
  residence_country?: string | null;
  birth_country?: string | null;
  family_origins?: string[];
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

/** First study whose eligibility rules triggered this flag, with the rule's wording. */
function evidenceFor(d: DrugDetail, flag: ExclusionFlag): Evidence | undefined {
  for (const t of d.trialList) {
    const e = t.exclusions.find((x) => x.flag === flag);
    if (e) return { nct: t.nct, quote: e.quote, live: d.live };
  }
  return undefined;
}

export function personalRows(p: ProfileLike, d: DrugDetail, t: Dict): PersonalRow[] {
  const s = d.summary, ex = s.exclusionPct, rep = s.reporting, P = t.personal;
  const rows: PersonalRow[] = [];
  const age = ageOf(p);
  const bmi = bmiOf(p);
  const add = (status: Status, text: string, weight: number, flag?: ExclusionFlag) =>
    rows.push({ status, text, weight, source: "studies", evidence: flag ? evidenceFor(d, flag) : undefined });

  if (s.pctFemale !== null) add(s.pctFemale < 40 ? "limited" : "included", P.women(s.pctFemale), s.pctFemale < 40 ? 50 - s.pctFemale : 0);

  if (age >= 65) {
    const aged = d.trialList.filter((x) => x.pct65 !== null && x.n);
    const n = aged.reduce((a, x) => a + (x.n ?? 0), 0);
    const pct65 = n ? Math.round((aged.reduce((a, x) => a + (x.pct65! / 100) * (x.n ?? 0), 0) / n) * 1000) / 10 : null;
    add(r(ex.older_adults_excluded) >= 30 || (pct65 ?? 0) < 10 ? "limited" : "included", P.older(r(ex.older_adults_excluded), pct65), r(ex.older_adults_excluded), "older_adults_excluded");
  }
  if (p.pregnancy_status === "pregnant") add("excluded", P.pregnant(r(ex.pregnant_excluded)), 100, "pregnant_excluded");
  if (p.breastfeeding) add("excluded", P.breastfeeding(r(ex.breastfeeding_excluded)), 90, "breastfeeding_excluded");

  const couldGetPregnant = p.sex_at_birth === "female" && age >= 15 && age <= 50 && p.menopause_status !== "post" && p.pregnancy_status !== "pregnant";
  if (couldGetPregnant && (ex.contraception_required || ex.childbearing_potential_excluded)) {
    add((ex.childbearing_potential_excluded ?? 0) >= 10 ? "excluded" : "limited", P.childbearing(r(ex.contraception_required), r(ex.childbearing_potential_excluded)),
      r(ex.childbearing_potential_excluded) || r(ex.contraception_required) / 2, ex.childbearing_potential_excluded ? "childbearing_potential_excluded" : "contraception_required");
  }
  if (p.hormonal_contraception) add(sev(ex.hormonal_contraception_excluded), P.bc(r(ex.hormonal_contraception_excluded)), r(ex.hormonal_contraception_excluded), "hormonal_contraception_excluded");
  if (p.hormone_therapy) add(sev(ex.hormone_therapy_excluded), P.hrt(r(ex.hormone_therapy_excluded)), r(ex.hormone_therapy_excluded), "hormone_therapy_excluded");

  if (bmi !== null && (bmi >= 30 || bmi < 18.5)) {
    if ((ex.bmi_limit ?? 0) > 0) add("limited", P.weight(bmi, r(ex.bmi_limit)), r(ex.bmi_limit), "bmi_limit");
    else add("unknown", P.weightUnknown(bmi, r(rep.bmi)), 5);
  }

  const raceTotal = Object.values(s.race).reduce((a, b) => a + b, 0);
  for (const key of p.race_ethnicity) {
    const bucket = RACE_BUCKET[key];
    if (!bucket) continue;
    const label = P.raceShort[key];
    if (rep.race < 50 || !raceTotal) add("unknown", P.raceUnknown(label), 10);
    else {
      const share = pctOf(s.race[bucket] ?? 0, raceTotal);
      add(share < 10 ? "limited" : "included", P.race(label, share), share < 10 ? 20 : 0);
    }
  }
  if (p.race_ethnicity.includes("hispanic")) {
    const tot = s.hispanic.yes + s.hispanic.no;
    if (tot) add(pctOf(s.hispanic.yes, tot) < 10 ? "limited" : "included", P.hispanic(pctOf(s.hispanic.yes, tot)), pctOf(s.hispanic.yes, tot) < 10 ? 20 : 0);
    else add("unknown", P.raceUnknown(t.lang === "es" ? "hispana o latina" : "Hispanic or Latina"), 10);
  }

  // Where the studies were run vs. where she lives / comes from.
  const withLoc = s.studiesWithLocations ?? 0;
  if (withLoc >= 3) {
    const places: [string, "live" | "born" | "family"][] = [];
    if (p.residence_country) places.push([p.residence_country, "live"]);
    if (p.birth_country && p.birth_country !== p.residence_country) places.push([p.birth_country, "born"]);
    for (const c of p.family_origins ?? []) if (!places.some(([x]) => x === c)) places.push([c, "family"]);
    for (const [code, kind] of places.slice(0, 4)) {
      const n = s.countryStudies?.[code] ?? 0;
      const region = REGION_OF[code];
      const regionN = region ? s.regionStudies?.[region] ?? 0 : 0;
      const share = pctOf(n, withLoc);
      const text = P.where(kind, countryInSentence(code), n, withLoc, region ? REGION_LABEL[region] : "", regionN);
      add(n === 0 ? (regionN === 0 ? "excluded" : "limited") : share < 10 ? "limited" : "included", text, n === 0 ? (regionN === 0 ? 60 : 30) : share < 10 ? 15 : 0);
    }
  }

  if (p.kidney_or_liver_disease && ex.kidney_liver_excluded) add(sev(ex.kidney_liver_excluded), P.kidney(r(ex.kidney_liver_excluded)), r(ex.kidney_liver_excluded), "kidney_liver_excluded");
  const CONDITION_FLAG: Record<string, ExclusionFlag> = {
    heart: "heart_excluded", diabetes: "diabetes_excluded", seizures: "seizure_excluded", mental_health: "mental_health_excluded", cancer: "cancer_excluded",
  };
  for (const c of p.conditions ?? []) {
    const flag = CONDITION_FLAG[c];
    if (flag && ex[flag]) add(sev(ex[flag]), c === "mental_health" ? P.mentalHealth(r(ex[flag])) : P.conditionExcluded(P.condShort[c], r(ex[flag])), r(ex[flag]), flag);
  }
  if (p.smoking === "current" && ex.smoker_excluded) add(sev(ex.smoker_excluded), P.smoker(r(ex.smoker_excluded)), r(ex.smoker_excluded), "smoker_excluded");
  if (p.menopause_status === "peri" || p.menopause_status === "post") add("unknown", P.menopause(r(rep.menopause)), 10);

  const bySex = r(rep.sexStratified);
  // For medicines tested (almost) only in women, "results by sex" isn't a meaningful gap.
  if ((s.pctFemale ?? 0) < 95) add("unknown", bySex === 0 ? P.noBySex : P.fewBySex(bySex), 8);

  return rows.sort((a, b) => ORDER[a.status] - ORDER[b.status] || b.weight - a.weight);
}
