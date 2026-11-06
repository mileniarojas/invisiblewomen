// Shared ClinicalTrials.gov parsing: used by the build script and by live look-ups on the site.
import { parseExclusions, FLAG_LABELS, type ExclusionFlag } from "./exclusions.ts";
import { drugNames } from "./aliases.ts";
import type { DrugSummary, Trial } from "./types.ts";

export const CTGOV_FIELDS = [
  "NCTId", "BriefTitle", "OfficialTitle", "Phase", "EnrollmentCount", "LeadSponsorName", "CompletionDate",
  "Condition", "InterventionName", "InterventionOtherName", "EligibilityModule",
  "BaselineCharacteristicsModule", "OutcomeMeasuresModule",
].join(",");

// Keep only studies whose interventions actually name the drug (the API search is fuzzy).
export function mentionsDrug(st: any, drug: string) {
  const ints = st.protocolSection?.armsInterventionsModule?.interventions ?? [];
  const text = ints.map((i: any) => [i.name, ...(i.otherNames ?? [])].join(" ")).join(" ").toLowerCase();
  return drugNames(drug).some((n) => new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(text));
}

// Replace the (huge) outcome module with a single flag: were any results reported separately by sex?
export function slim(st: any) {
  const measures = st.resultsSection?.outcomeMeasuresModule?.outcomeMeasures ?? [];
  const sexWords = /\b(female|male|women|men|sex|gender)\b/i;
  const sexStratified = measures.some((m: any) =>
    sexWords.test(m.title ?? "") ||
    (m.classes ?? []).some((c: any) => sexWords.test(c.title ?? "") || (c.categories ?? []).some((k: any) => sexWords.test(k.title ?? ""))));
  if (st.resultsSection) delete st.resultsSection.outcomeMeasuresModule;
  return { ...st, sexStratified };
}

const num = (v: any): number | null => {
  const n = parseFloat(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};

const RACE_BUCKETS: [RegExp, string][] = [
  [/not reported|unknown|declined|missing|not collected/i, "Not reported"],
  [/more than one|multi|mixed|two or more/i, "More than one race"],
  [/hawaiian|pacific/i, "Native Hawaiian / Pacific Islander"],
  [/american indian|alaska|indigenous|native american/i, "American Indian / Alaska Native"],
  [/black|african/i, "Black / African American"],
  [/white|caucasian|european/i, "White"],
  [/\basian|japanese|chinese|korean|indian \(asian\)|south asian/i, "Asian"],
  [/hispan|latin/i, "Hispanic / Latina (as race)"],
];
const bucketRace = (t: string) => RACE_BUCKETS.find(([re]) => re.test(t))?.[1] ?? "Other";

export function parseStudy(st: any): Trial {
  const p = st.protocolSection ?? {};
  const elig = p.eligibilityModule ?? {};
  const b = st.resultsSection?.baselineCharacteristicsModule;
  const groups: any[] = b?.groups ?? [];
  const total = groups.find((g) => /^total$/i.test(g.title?.trim())) ?? (groups.length === 1 ? groups[0] : null);
  // Count for a category: total group if present, else sum of arm groups.
  const val = (cat: any): number | null => {
    const ms: any[] = cat?.measurements ?? [];
    if (total) return num(ms.find((m) => m.groupId === total.id)?.value);
    const vals = ms.map((m) => num(m.value)).filter((x): x is number => x !== null);
    return vals.length ? vals.reduce((a, c) => a + c, 0) : null;
  };
  const measures: any[] = b?.measures ?? [];
  const cats = (m: any) => (m.classes ?? []).flatMap((c: any) => (c.categories ?? []).map((k: any) => ({ title: k.title ?? c.title ?? "", cat: k })));

  let female: number | null = null, male: number | null = null;
  let race: Record<string, number> | null = null, ethnicity: Record<string, number> | null = null;
  let bmi: string | null = null, ageMean: string | null = null, pct65: number | null = null;
  let n: number | null = null;
  if (b?.denoms?.[0]) {
    const counts = b.denoms[0].counts ?? [];
    n = total ? num(counts.find((c: any) => c.groupId === total.id)?.value) : counts.reduce((a: number, c: any) => a + (num(c.value) ?? 0), 0);
  }
  const reports = { sex: false, race: false, ethnicity: false, bmi: false, pregnancy: false, menopause: false };

  for (const m of measures) {
    const t: string = m.title ?? "";
    const isCount = m.paramType === "COUNT_OF_PARTICIPANTS" || m.paramType === "NUMBER";
    if (/\b(sex|gender)\b/i.test(t) && isCount) {
      for (const { title, cat } of cats(m)) {
        if (/^\s*(female|women|woman|girls?)\b/i.test(title)) female = (female ?? 0) + (val(cat) ?? 0);
        else if (/^\s*(male|men|man|boys?)\b/i.test(title)) male = (male ?? 0) + (val(cat) ?? 0);
      }
      if (female !== null || male !== null) reports.sex = true;
    } else if ((/race/i.test(t) || /ethnic/i.test(t)) && isCount) {
      const cs = cats(m);
      // A "Race/Ethnicity" measure whose categories are only Hispanic / not Hispanic / unknown is an ethnicity measure.
      const ethnicOnly = !/race/i.test(t) || (cs.some((c: any) => /hispan|latin/i.test(c.title)) &&
        !cs.some((c: any) => /white|caucasian|black|african|asian/i.test(c.title)));
      if (ethnicOnly) {
        ethnicity ??= {};
        for (const { title, cat } of cs) {
          const v = val(cat) ?? 0;
          const k = /\bnot\b|non-?hispan|non-?latin/i.test(title) ? "Not Hispanic or Latina" : /hispan|latin/i.test(title) ? "Hispanic or Latina" : "Not reported";
          ethnicity[k] = (ethnicity[k] ?? 0) + v;
        }
        reports.ethnicity = true;
      } else {
        race ??= {};
        for (const { title, cat } of cs) {
          const k = bucketRace(title);
          race[k] = (race[k] ?? 0) + (val(cat) ?? 0);
        }
        reports.race = true;
      }
    } else if (/\bbmi\b|body mass/i.test(t)) {
      reports.bmi = true;
      const first = cats(m)[0];
      const v = total ? first?.cat?.measurements?.find((x: any) => x.groupId === total.id)?.value : first?.cat?.measurements?.[0]?.value;
      if (v) bmi = `${m.paramType === "MEDIAN" ? "median" : "mean"} ${v} ${m.unitOfMeasure ?? "kg/m²"}`;
    } else if (/^age\b/i.test(t)) {
      if (!isCount) {
        const first = cats(m)[0];
        const v = total ? first?.cat?.measurements?.find((x: any) => x.groupId === total.id)?.value : first?.cat?.measurements?.[0]?.value;
        if (v && !ageMean) ageMean = `${m.paramType === "MEDIAN" ? "median" : "mean"} ${v} ${m.unitOfMeasure ?? "years"}`;
      } else {
        let older = 0, all = 0;
        for (const { title, cat } of cats(m)) {
          const v = val(cat) ?? 0;
          all += v;
          // Older bucket = category whose lower bound is >= 65 (">=65", "From 65 to 84", "85 years and over").
          const lower = /^\s*(<|≤|up to|under|less)/i.test(title) ? null : num(title.match(/\d+/)?.[0]);
          if (lower !== null && lower >= 65) older += v;
        }
        if (all > 0 && pct65 === null) pct65 = Math.round((older / all) * 1000) / 10;
      }
    }
    if (/pregnan/i.test(t)) reports.pregnancy = true;
    if (/menopaus/i.test(t)) reports.menopause = true;
  }

  return {
    nct: p.identificationModule?.nctId,
    title: p.identificationModule?.briefTitle ?? "",
    phases: p.designModule?.phases ?? [],
    enrollment: p.designModule?.enrollmentInfo?.count ?? null,
    sponsor: p.sponsorCollaboratorsModule?.leadSponsor?.name ?? null,
    completion: p.statusModule?.completionDateStruct?.date ?? null,
    conditions: p.conditionsModule?.conditions ?? [],
    sexEligible: elig.sex ?? "ALL",
    minAge: elig.minimumAge ?? null,
    maxAge: elig.maximumAge ?? null,
    n, female, male, race, ethnicity, bmi, ageMean, pct65, reports,
    sexStratified: !!st.sexStratified,
    exclusions: parseExclusions({ criteria: elig.eligibilityCriteria, sex: elig.sex, maximumAge: elig.maximumAge }),
  };
}

export const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);

export function summarize(trials: Trial[], loaded: boolean): DrugSummary {
  const withSex = trials.filter((t) => t.reports.sex && (t.female ?? 0) + (t.male ?? 0) > 0);
  const female = Math.round(withSex.reduce((a, t) => a + (t.female ?? 0), 0));
  const participants = Math.round(withSex.reduce((a, t) => a + (t.female ?? 0) + (t.male ?? 0), 0));
  const exclusionPct: DrugSummary["exclusionPct"] = {};
  for (const flag of Object.keys(FLAG_LABELS) as ExclusionFlag[]) {
    const c = trials.filter((t) => t.exclusions.some((e) => e.flag === flag)).length;
    if (c) exclusionPct[flag] = pct(c, trials.length);
  }
  const race: Record<string, number> = {};
  const hispanic = { yes: 0, no: 0, unknown: 0 };
  for (const t of trials) {
    for (const [k, v] of Object.entries(t.race ?? {})) race[k] = (race[k] ?? 0) + v;
    for (const [k, v] of Object.entries(t.ethnicity ?? {})) {
      if (k === "Hispanic or Latina") hispanic.yes += v; else if (k === "Not Hispanic or Latina") hispanic.no += v; else hispanic.unknown += v;
    }
  }
  const r = (f: (t: Trial) => boolean) => pct(trials.filter(f).length, trials.length);
  return {
    trialsLoaded: loaded,
    trials: trials.length,
    trialsWithSex: withSex.length,
    participants,
    female,
    pctFemale: participants ? pct(female, participants) : null,
    womenOnlyTrials: trials.filter((t) => t.sexEligible === "FEMALE").length,
    menOnlyTrials: trials.filter((t) => t.sexEligible === "MALE").length,
    reporting: {
      race: r((t) => t.reports.race), ethnicity: r((t) => t.reports.ethnicity), bmi: r((t) => t.reports.bmi),
      pregnancy: r((t) => t.reports.pregnancy), menopause: r((t) => t.reports.menopause), sexStratified: r((t) => t.sexStratified),
    },
    exclusionPct,
    race,
    hispanic,
  };
}

