import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { DrugDetail, DrugIndexEntry } from "./types";

const dir = path.join(process.cwd(), "data", "build");
let indexCache: DrugIndexEntry[] | null = null;
let nctCache: Record<string, string[]> | null = null;

export async function getDrugIndex(): Promise<DrugIndexEntry[]> {
  indexCache ??= JSON.parse(await readFile(path.join(dir, "drugs.json"), "utf8"));
  return indexCache!;
}

export async function getDrug(slug: string): Promise<DrugDetail | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  try {
    return JSON.parse(await readFile(path.join(dir, "drugs", `${slug}.json`), "utf8"));
  } catch {
    return null;
  }
}

export async function getTrial(nct: string) {
  nctCache ??= JSON.parse(await readFile(path.join(dir, "ncts.json"), "utf8"));
  const slugs = nctCache![nct.toUpperCase()] ?? [];
  if (!slugs.length) return null;
  const drugs = (await Promise.all(slugs.map(getDrug))).filter((d): d is DrugDetail => !!d);
  const trial = drugs[0]?.trialList.find((t) => t.nct === nct.toUpperCase());
  return trial ? { trial, drugs: drugs.map((d) => ({ slug: d.slug, name: d.name })) } : null;
}

/** Totals across all featured drugs, for the home page. */
export async function getTotals() {
  const index = await getDrugIndex();
  const drugs = (await Promise.all(index.map((d) => getDrug(d.slug)))).filter((d): d is DrugDetail => !!d);
  let trials = 0, people = 0, women = 0, preg = 0, bf = 0, age = 0, bySex = 0, race = 0, pregRecorded = 0;
  for (const d of drugs) {
    const s = d.summary, n = s.trials;
    trials += n; people += s.participants; women += s.female;
    preg += ((s.exclusionPct.pregnant_excluded ?? 0) * n) / 100;
    bf += ((s.exclusionPct.breastfeeding_excluded ?? 0) * n) / 100;
    age += ((s.exclusionPct.older_adults_excluded ?? 0) * n) / 100;
    bySex += (s.reporting.sexStratified * n) / 100;
    race += (s.reporting.race * n) / 100;
    pregRecorded += d.trialList.filter((t) => t.reports.pregnancy).length;
  }
  const pct = (x: number) => Math.round((x / trials) * 100);
  return {
    trials, people, pctWomen: Math.round((women / people) * 1000) / 10,
    pregExcluded: pct(preg), bfExcluded: pct(bf), ageCapped: pct(age), noRace: 100 - pct(race),
    bySexCount: Math.round(bySex), bySexPct: Math.round((bySex / trials) * 1000) / 10, pregRecorded,
    under50: drugs.filter((d) => (d.summary.pctFemale ?? 0) < 50).length,
  };
}

/** Every AwareDX drug with its sex-biased side-effect counts and top female-biased effects (for search). */
export type AdrIndexEntry = { name: string; isClass: boolean; femaleCount: number; maleCount: number; female: { event: string; logRor: number }[] };
let adrIndexCache: Record<string, AdrIndexEntry> | null = null;
export async function getAdrIndex(): Promise<Record<string, AdrIndexEntry>> {
  adrIndexCache ??= JSON.parse(await readFile(path.join(dir, "adrs.json"), "utf8"));
  return adrIndexCache!;
}
