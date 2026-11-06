// Build static JSON the site reads: data/build/drugs.json (index) and data/build/drugs/<slug>.json.
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { parseCsv } from "../lib/csv.ts";
import { slugify } from "../lib/slug.ts";
import { FEATURED_SLUGS, SEX_SPECIFIC_EVENT } from "../lib/featured.ts";
import { parseStudy, summarize, pct } from "../lib/trials.ts";
import type { Adr, DrugDetail, DrugIndexEntry, PgxExample, Trial } from "../lib/types.ts";

const adrRows = parseCsv(readFileSync("data/sex_biased_adrs.csv", "utf8"));
const pgxRows = parseCsv(readFileSync("data/pgx_examples.csv", "utf8"));

// ── Group AwareDX rows by drug ──
const byDrug = new Map<string, { isClass: boolean; f: Adr[]; m: Adr[] }>();
for (const row of adrRows) {
  const e = byDrug.get(row.drug) ?? { isClass: row.atc_level === "4", f: [], m: [] };
  const adr: Adr = {
    event: row.adverse_event, level: row.meddra_level as Adr["level"],
    logRor: +(+row.log_ror).toFixed(3), ciLow: +(+row.ci_low).toFixed(3), ciHigh: +(+row.ci_high).toFixed(3), pMedian: +row.p_median,
  };
  if (SEX_SPECIFIC_EVENT.test(adr.event)) continue;
  (row.risk_sex === "F" ? e.f : e.m).push(adr);
  byDrug.set(row.drug, e);
}

rmSync("data/build", { recursive: true, force: true });
mkdirSync("data/build/drugs", { recursive: true });
const index: DrugIndexEntry[] = [];
const ncts: Record<string, string[]> = {};
let withTrials = 0;
// Compact side-effect index for every AwareDX drug, used by live look-ups of non-featured medicines.
const adrIndex: Record<string, { name: string; isClass: boolean; femaleCount: number; maleCount: number; female: Adr[] }> = {};
for (const [name, e] of byDrug) {
  e.f.sort((a, b) => b.logRor - a.logRor);
  e.m.sort((a, b) => a.logRor - b.logRor);
  adrIndex[slugify(name)] = { name, isClass: e.isClass, femaleCount: e.f.length, maleCount: e.m.length, female: e.f.slice(0, 8) };
}
writeFileSync("data/build/adrs.json", JSON.stringify(adrIndex));

for (const [name, e] of byDrug) {
  const slug = slugify(name);
  if (!FEATURED_SLUGS.has(slug)) continue;
  const rawFile = `data/raw/${slug}.json`;
  const loaded = existsSync(rawFile);
  const trialList: Trial[] = loaded
    ? JSON.parse(readFileSync(rawFile, "utf8")).studies.map(parseStudy).filter((t: Trial) => t.nct)
    : [];
  if (loaded) withTrials++;
  trialList.sort((a, b) => (b.n ?? 0) - (a.n ?? 0));
  for (const t of trialList) (ncts[t.nct] ??= []).push(slug);
  const summary = summarize(trialList, loaded);
  const pgx: PgxExample[] = pgxRows
    .filter((r) => r.drug.toLowerCase() === name.toLowerCase())
    .map((r) => ({ gene: r.gene, geneTitle: r.gene_title, variant: r.variant, annotation: r.clinical_annotation, evidence: r.evidence_level, adr: r.adr, expectedSex: r.expected_sex, observedSex: r.observed_sex }));
  const entry: DrugIndexEntry = {
    slug, name, isClass: e.isClass, femaleAdrs: e.f.length, maleAdrs: e.m.length,
    topFemaleAdr: e.f[0]?.event ?? null,
    pctFemale: summary.pctFemale,
    trials: loaded ? summary.trials : null,
    pregnantExcludedPct: loaded && summary.trials ? summary.exclusionPct.pregnant_excluded ?? 0 : null,
    menOnlyPct: loaded && summary.trials ? pct(summary.menOnlyTrials, summary.trials) : null,
  };
  index.push(entry);
  const ev = existsSync(`data/labels/${slug}.json`) ? JSON.parse(readFileSync(`data/labels/${slug}.json`, "utf8")).focus : {};
  // Drop registry matches that aren't really about the group (e.g. polycystic *kidney* disease, "born preterm").
  const NOT_ABOUT = /polycystic kidney|ADPKD|born preterm|lithium-induced/i;
  const clean = (l: any[] = []) => l.filter((x) => !NOT_ABOUT.test(x.title) && x.status !== "WITHDRAWN");
  const focus = { pregnancy: clean(ev.pregnancy), breastfeeding: clean(ev.breastfeeding), menopause: clean(ev.menopause), womenUses: clean(ev.pcos_or_skin) };
  const detail: DrugDetail = { ...entry, summary, focus, femaleRisks: e.f, maleRisks: e.m.slice(0, 25), pgx, trialList };
  writeFileSync(`data/build/drugs/${slug}.json`, JSON.stringify(detail));
}
index.sort((a, b) => b.femaleAdrs - a.femaleAdrs);
writeFileSync("data/build/drugs.json", JSON.stringify(index));
writeFileSync("data/build/ncts.json", JSON.stringify(ncts));
console.log(`built ${index.length} drugs (${withTrials} with trial data)`);
