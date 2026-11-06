import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { CTGOV_FIELDS, mentionsDrug, parseStudy, slim, summarize } from "./trials";
import { US_NAMES, drugNames } from "./aliases";
import { slugify } from "./slug";
import type { Adr, DrugDetail, Trial } from "./types";

// ─── RxNorm: turn whatever the user picked (brand, dose form, ingredient) into ingredient names ───
const RXNAV = "https://rxnav.nlm.nih.gov/REST";

export async function ingredientsFor(name: string, rxcui?: string | null): Promise<string[]> {
  try {
    let id = rxcui ?? null;
    if (!id) {
      const j = await (await fetch(`${RXNAV}/approximateTerm.json?term=${encodeURIComponent(name)}&maxEntries=1&option=1`, { next: { revalidate: 86400 * 30 } })).json();
      id = j.approximateGroup?.candidate?.[0]?.rxcui ?? null;
    }
    if (id) {
      const j = await (await fetch(`${RXNAV}/rxcui/${id}/related.json?tty=IN+MIN`, { next: { revalidate: 86400 * 30 } })).json();
      const groups: any[] = j.relatedGroup?.conceptGroup ?? [];
      const ins = groups.filter((g) => g.tty === "IN").flatMap((g) => g.conceptProperties ?? []).map((c: any) => String(c.name).toLowerCase());
      if (ins.length) return [...new Set(ins)];
      const self = await (await fetch(`${RXNAV}/rxcui/${id}/properties.json`, { next: { revalidate: 86400 * 30 } })).json();
      if (self.properties?.tty === "IN") return [String(self.properties.name).toLowerCase()];
    }
  } catch { /* fall through */ }
  // Fallback: strip doses and dose forms from the typed text.
  const clean = name.toLowerCase().replace(/\b\d+(\.\d+)?\s*(mg|mcg|ml|%|unt|units?)\b.*$/i, "").replace(/\b(oral|tablet|capsule|extended|release|injection|solution)\b.*$/i, "").trim();
  return clean ? [clean] : [];
}

/** Is this a real ingredient name in RxNorm? Guards live look-ups from arbitrary URLs. */
export async function isKnownIngredient(name: string): Promise<boolean> {
  try {
    const j = await (await fetch(`${RXNAV}/rxcui.json?name=${encodeURIComponent(name)}&search=2`, { next: { revalidate: 86400 * 30 } })).json();
    return (j.idGroup?.rxnormId ?? []).length > 0;
  } catch {
    return false;
  }
}

// ─── AwareDX side-effect index (all 745 drugs) ───
type AdrEntry = { name: string; isClass: boolean; femaleCount: number; maleCount: number; female: Adr[] };
let adrCache: Record<string, AdrEntry> | null = null;
async function adrFor(ingredient: string): Promise<AdrEntry | null> {
  adrCache ??= JSON.parse(await readFile(path.join(process.cwd(), "data", "build", "adrs.json"), "utf8"));
  const tries = [ingredient, ...Object.entries(US_NAMES).filter(([, us]) => us.includes(ingredient)).map(([who]) => who)];
  for (const n of tries) {
    const hit = adrCache![slugify(n)];
    if (hit) return hit;
  }
  return null;
}

// ─── ClinicalTrials.gov live fetch, cached in memory and on disk for a week ───
const memo = new Map<string, Promise<DrugDetail>>();
const CACHE_DIR = path.join(tmpdir(), "invisiblewoman-cache");
const WEEK = 7 * 24 * 3600 * 1000;

async function fetchStudies(ingredient: string) {
  const studies: any[] = [];
  let token = "";
  for (let page = 0; page < 2; page++) {
    const u = new URL("https://clinicaltrials.gov/api/v2/studies");
    u.searchParams.set("query.intr", drugNames(ingredient)[0]);
    u.searchParams.set("filter.overallStatus", "COMPLETED");
    u.searchParams.set("aggFilters", "results:with");
    u.searchParams.set("fields", CTGOV_FIELDS);
    u.searchParams.set("pageSize", "100");
    if (token) u.searchParams.set("pageToken", token);
    const res = await fetch(u, { cache: "no-store" });
    if (!res.ok) break;
    const j = await res.json();
    studies.push(...(j.studies ?? []));
    token = j.nextPageToken;
    if (!token) break;
  }
  return studies.filter((s) => mentionsDrug(s, ingredient)).map(slim);
}

async function build(ingredient: string): Promise<DrugDetail> {
  const slug = slugify(ingredient);
  const file = path.join(CACHE_DIR, `${slug}.json`);
  try {
    const cached = JSON.parse(await readFile(file, "utf8"));
    if (Date.now() - cached.at < WEEK) return cached.drug;
  } catch { /* no cache */ }

  const [raw, adr] = await Promise.all([fetchStudies(ingredient), adrFor(ingredient)]);
  const trialList: Trial[] = raw.map(parseStudy).filter((t) => t.nct).sort((a, b) => (b.n ?? 0) - (a.n ?? 0));
  const summary = summarize(trialList, true);
  const drug: DrugDetail = {
    slug, name: ingredient, isClass: false,
    femaleAdrs: adr?.femaleCount ?? 0, maleAdrs: adr?.maleCount ?? 0, topFemaleAdr: adr?.female[0]?.event ?? null,
    pctFemale: summary.pctFemale, trials: summary.trials,
    pregnantExcludedPct: summary.trials ? summary.exclusionPct.pregnant_excluded ?? 0 : null,
    menOnlyPct: summary.trials ? Math.round((summary.menOnlyTrials / summary.trials) * 1000) / 10 : null,
    summary, focus: { pregnancy: [], breastfeeding: [], menopause: [], womenUses: [] },
    femaleRisks: adr?.female ?? [], maleRisks: [], pgx: [], trialList, live: true,
  };
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(file, JSON.stringify({ at: Date.now(), drug }));
  } catch { /* read-only disk is fine */ }
  return drug;
}

/** Study breakdown for any ingredient, fetched from ClinicalTrials.gov on demand. */
export function getLiveDrug(ingredient: string): Promise<DrugDetail> {
  const key = ingredient.toLowerCase().trim();
  if (!memo.has(key)) memo.set(key, build(key).catch((e) => { memo.delete(key); throw e; }));
  return memo.get(key)!;
}
