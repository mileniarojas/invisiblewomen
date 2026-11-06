// Parses ClinicalTrials.gov eligibility text into flags describing which women were left out.

export type ExclusionFlag =
  | "women_not_eligible"
  | "pregnant_excluded"
  | "breastfeeding_excluded"
  | "childbearing_potential_excluded"
  | "contraception_required"
  | "hormonal_contraception_excluded"
  | "hormone_therapy_excluded"
  | "postmenopausal_only"
  | "older_adults_excluded"
  | "bmi_limit"
  | "kidney_liver_excluded";

export interface Exclusion {
  flag: ExclusionFlag;
  quote: string;
}

export const FLAG_LABELS: Record<ExclusionFlag, { label: string; who: string }> = {
  women_not_eligible: { label: "Women not eligible", who: "All women — this trial enrolled men only." },
  pregnant_excluded: { label: "Pregnant women excluded", who: "Anyone pregnant, so there is no trial safety data for pregnancy." },
  breastfeeding_excluded: { label: "Breastfeeding women excluded", who: "Nursing mothers — no data on the drug passing into breast milk." },
  childbearing_potential_excluded: { label: "Women who could get pregnant excluded", who: "Most women aged roughly 15–50 unless sterilised or postmenopausal." },
  contraception_required: { label: "Contraception required", who: "Women who can't or won't use birth control were screened out." },
  hormonal_contraception_excluded: { label: "Hormonal birth control excluded", who: "Women on the pill, patch, ring, implant or hormonal IUD." },
  hormone_therapy_excluded: { label: "Hormone therapy excluded", who: "Women on menopause hormone therapy (HRT) or gender-affirming hormones." },
  postmenopausal_only: { label: "Only postmenopausal / sterile women", who: "Premenopausal women able to have children." },
  older_adults_excluded: { label: "Older adults excluded", who: "Older women — who are the majority of people over 65." },
  bmi_limit: { label: "Body size (BMI) limit", who: "Women outside the allowed BMI range, often women with obesity." },
  kidney_liver_excluded: { label: "Kidney / liver disease excluded", who: "Women with reduced kidney or liver function." },
};

const RULES: { flag: ExclusionFlag; section: "exclusion" | "inclusion" | "any"; re: RegExp; unless?: RegExp }[] = [
  { flag: "pregnant_excluded", section: "exclusion", re: /pregnan/i },
  { flag: "pregnant_excluded", section: "inclusion", re: /(not|non)[- ]pregnant|negative (serum |urine )?pregnancy test/i },
  { flag: "breastfeeding_excluded", section: "exclusion", re: /breast[- ]?feed|lactat|nursing (mother|wom)/i },
  { flag: "breastfeeding_excluded", section: "inclusion", re: /not (be )?(breast[- ]?feeding|lactating|nursing)/i },
  { flag: "childbearing_potential_excluded", section: "exclusion", re: /(childbearing|child-bearing|reproductive) potential|\bWOCBP\b/i, unless: /contracept|birth control|unless|not using|who are not|without/i },
  { flag: "contraception_required", section: "any", re: /contracept|birth control|barrier method|abstinen/i, unless: /hormonal contracept|oral contracept/i },
  { flag: "hormonal_contraception_excluded", section: "exclusion", re: /(oral|hormonal) contracept|birth control pill|\bOCPs?\b|contraceptive (pill|patch|implant)/i },
  { flag: "hormone_therapy_excluded", section: "exclusion", re: /hormone replacement|\bHRT\b|estrogen (therapy|replacement)|hormone therapy/i },
  { flag: "postmenopausal_only", section: "inclusion", re: /post-?menopausal|surgically steril|not of (childbearing|child-bearing) potential/i, unless: /or (using|use|practicing|agree)|contracept/i },
  { flag: "bmi_limit", section: "any", re: /\bBMI\b|body mass index/i },
  { flag: "kidney_liver_excluded", section: "exclusion", re: /(renal|kidney|hepatic|liver) (impairment|insufficiency|disease|failure|dysfunction)|creatinine clearance/i },
];

/** Split text into inclusion/exclusion criterion lines. */
export function splitCriteria(text: string): { inclusion: string[]; exclusion: string[] } {
  const inclusion: string[] = [];
  const exclusion: string[] = [];
  let section: "inclusion" | "exclusion" = "inclusion";
  for (const raw of text.split(/\n+/)) {
    const line = raw.replace(/^\s*([*\-•]|\d+[.)])\s*/, "").trim();
    if (!line) continue;
    if (/^exclusion criteria/i.test(line) || /^key exclusion/i.test(line)) { section = "exclusion"; continue; }
    if (/^inclusion criteria/i.test(line) || /^key inclusion/i.test(line)) { section = "inclusion"; continue; }
    (section === "exclusion" ? exclusion : inclusion).push(line);
  }
  return { inclusion, exclusion };
}

/** Shorten a criterion to ~n chars, keeping the matched phrase in view. */
function clip(s: string, re?: RegExp, n = 240) {
  if (s.length <= n) return s;
  const at = re ? Math.max(0, s.search(re)) : 0;
  const start = Math.max(0, Math.min(at - 80, s.length - n));
  const out = s.slice(start, start + n).trim();
  return (start > 0 ? "…" : "") + out + (start + n < s.length ? "…" : "");
}

export function parseAgeYears(v?: string | null): number | null {
  if (!v) return null;
  const m = v.match(/([\d.]+)\s*(year|month|week|day)/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const unit = m[2].toLowerCase();
  return unit === "year" ? n : unit === "month" ? n / 12 : unit === "week" ? n / 52 : n / 365;
}

export function parseExclusions(input: {
  criteria?: string | null;
  sex?: string | null; // ALL | FEMALE | MALE
  maximumAge?: string | null;
}): Exclusion[] {
  const out: Exclusion[] = [];
  const seen = new Set<ExclusionFlag>();
  const add = (flag: ExclusionFlag, quote: string, re?: RegExp) => {
    if (seen.has(flag)) return;
    seen.add(flag);
    out.push({ flag, quote: clip(quote, re) });
  };

  if (input.sex === "MALE") add("women_not_eligible", "Eligibility: Male participants only.");
  const maxAge = parseAgeYears(input.maximumAge);
  if (maxAge !== null && maxAge < 65) add("older_adults_excluded", `Maximum age: ${input.maximumAge}.`);

  const { inclusion, exclusion } = splitCriteria(input.criteria ?? "");
  for (const rule of RULES) {
    const lines = rule.section === "exclusion" ? exclusion : rule.section === "inclusion" ? inclusion : [...inclusion, ...exclusion];
    const hit = lines.find((l) => rule.re.test(l) && !(rule.unless && rule.unless.test(l)));
    if (hit) add(rule.flag, hit, rule.re);
  }
  return out;
}
