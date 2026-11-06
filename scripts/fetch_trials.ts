// Fetch completed trials with posted results from ClinicalTrials.gov for the drugs
// with the most female-biased adverse events in AwareDX. Caches raw JSON in data/raw/.
// Usage: npm run data:trials -- [limit=150]
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { parseCsv } from "../lib/csv.ts";
import { slugify } from "../lib/slug.ts";
import { drugNames } from "../lib/aliases.ts";
import { CTGOV_FIELDS, mentionsDrug, slim } from "../lib/trials.ts";

const LIMIT = Number(process.argv[2] ?? 150);

const rows = parseCsv(readFileSync("data/sex_biased_adrs.csv", "utf8"));
const counts = new Map<string, number>();
for (const r of rows) if (r.atc_level === "5" && r.risk_sex === "F") counts.set(r.drug, (counts.get(r.drug) ?? 0) + 1);
const drugs = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, LIMIT).map(([d]) => d);

mkdirSync("data/raw", { recursive: true });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function get(url: string, tries = 4): Promise<any> {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { headers: { "User-Agent": "InvisibleWoman research site" } });
    if (res.ok) return res.json();
    if (res.status === 429 || res.status >= 500) { await sleep(2000 * (i + 1)); continue; }
    throw new Error(`${res.status} ${url}`);
  }
  throw new Error(`gave up ${url}`);
}

let n = 0;
for (const drug of drugs) {
  const file = `data/raw/${slugify(drug)}.json`;
  n++;
  if (existsSync(file)) continue;
  const studies: any[] = [];
  let token = "";
  for (let page = 0; page < 2; page++) {
    const u = new URL("https://clinicaltrials.gov/api/v2/studies");
    u.searchParams.set("query.intr", drugNames(drug)[0]);
    u.searchParams.set("filter.overallStatus", "COMPLETED");
    u.searchParams.set("aggFilters", "results:with");
    u.searchParams.set("fields", CTGOV_FIELDS);
    u.searchParams.set("pageSize", "100");
    if (token) u.searchParams.set("pageToken", token);
    const data = await get(u.toString());
    studies.push(...(data.studies ?? []));
    token = data.nextPageToken;
    await sleep(700);
    if (!token) break;
  }
  const kept = studies.filter((st) => mentionsDrug(st, drug)).map(slim);
  writeFileSync(file, JSON.stringify({ drug, fetchedAt: new Date().toISOString(), studies: kept }));
  console.log(`[${n}/${drugs.length}] ${drug}: ${kept.length}/${studies.length} studies kept`);
}
console.log("done");
