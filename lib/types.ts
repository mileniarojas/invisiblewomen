import type { Exclusion, ExclusionFlag } from "./exclusions";

export interface Adr {
  event: string;
  level: "soc" | "hlgt";
  logRor: number;
  ciLow: number;
  ciHigh: number;
  pMedian: number;
}

export interface PgxExample {
  gene: string;
  geneTitle: string;
  variant: string;
  annotation: string;
  evidence: string;
  adr: string;
  expectedSex: string;
  observedSex: string;
}

export interface Trial {
  nct: string;
  title: string;
  phases: string[];
  enrollment: number | null;
  sponsor: string | null;
  completion: string | null;
  conditions: string[];
  sexEligible: string; // ALL | FEMALE | MALE
  minAge: string | null;
  maxAge: string | null;
  n: number | null; // baseline participants
  female: number | null;
  male: number | null;
  race: Record<string, number> | null;
  ethnicity: Record<string, number> | null;
  bmi: string | null;
  ageMean: string | null;
  pct65: number | null;
  reports: { sex: boolean; race: boolean; ethnicity: boolean; bmi: boolean; pregnancy: boolean; menopause: boolean };
  sexStratified: boolean;
  /** ISO country codes where the study had at least one site */
  countries?: string[];
  exclusions: Exclusion[];
}

export interface DrugSummary {
  trialsLoaded: boolean;
  trials: number;
  trialsWithSex: number;
  participants: number;
  female: number;
  pctFemale: number | null;
  womenOnlyTrials: number;
  menOnlyTrials: number;
  reporting: { race: number; ethnicity: number; bmi: number; pregnancy: number; menopause: number; sexStratified: number }; // % of trials
  exclusionPct: Partial<Record<ExclusionFlag, number>>;
  race: Record<string, number>;
  hispanic: { yes: number; no: number; unknown: number };
  studiesWithLocations?: number;
  countryStudies?: Record<string, number>;
  regionStudies?: Record<string, number>;
}

export interface DrugIndexEntry {
  slug: string;
  name: string;
  isClass: boolean;
  femaleAdrs: number;
  maleAdrs: number;
  topFemaleAdr: string | null;
  pctFemale: number | null;
  trials: number | null;
  pregnantExcludedPct: number | null;
  menOnlyPct: number | null;
}

export interface FocusTrial { nct: string; title: string; status: string; results: boolean; n: number | null }

export interface DrugDetail extends DrugIndexEntry {
  focus: { pregnancy: FocusTrial[]; breastfeeding: FocusTrial[]; menopause: FocusTrial[]; womenUses: FocusTrial[] };
  summary: DrugSummary;
  femaleRisks: Adr[];
  maleRisks: Adr[];
  pgx: PgxExample[];
  trialList: Trial[];
  /** true when fetched live from ClinicalTrials.gov rather than pre-built */
  live?: boolean;
}
