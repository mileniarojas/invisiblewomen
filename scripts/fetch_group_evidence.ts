// For each featured drug: FDA label sections about specific groups of women, and counts of
// ClinicalTrials.gov studies (any status) that focused on pregnancy / breastfeeding / menopause / older adults.
import { writeFileSync, mkdirSync } from "node:fs";
import { FEATURED } from "../lib/featured.ts";
import { drugNames } from "../lib/aliases.ts";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const SECTIONS = ["pregnancy", "pregnancy_or_breast_feeding", "lactation", "nursing_mothers", "use_in_specific_populations",
  "geriatric_use", "females_and_males_of_reproductive_potential", "teratogenic_effects", "precautions"];

async function label(name: string) {
  const u = `https://api.fda.gov/drug/label.json?search=${encodeURIComponent(`openfda.generic_name:"${name}"`)}&limit=1&sort=effective_time:desc`;
  const r = await fetch(u);
  if (!r.ok) return null;
  const j = await r.json();
  const l = j.results?.[0];
  if (!l) return null;
  return { effective: l.effective_time, brand: l.openfda?.brand_name?.[0] ?? null, ...Object.fromEntries(SECTIONS.filter((k) => l[k]).map((k) => [k, l[k].join("\n")])) };
}

// Pull up to 300 candidate studies per search, then keep only those whose title or conditions are really about the group.
async function focused(name: string, term: string, keep: RegExp) {
  const out: any[] = [];
  let token = "";
  for (let page = 0; page < 3; page++) {
    const u = new URL("https://clinicaltrials.gov/api/v2/studies");
    u.searchParams.set("query.intr", name);
    u.searchParams.set("query.term", term);
    u.searchParams.set("pageSize", "100");
    u.searchParams.set("fields", "NCTId,BriefTitle,OfficialTitle,Condition,OverallStatus,HasResults,InterventionName,EnrollmentCount,Sex,MinimumAge");
    if (token) u.searchParams.set("pageToken", token);
    const j = await (await fetch(u)).json();
    await sleep(500);
    for (const st of j.studies ?? []) {
      const p = st.protocolSection;
      const text = [p.identificationModule.briefTitle, p.identificationModule.officialTitle, ...(p.conditionsModule?.conditions ?? [])].join(" | ");
      const ints = (p.armsInterventionsModule?.interventions ?? []).map((i: any) => i.name).join(" ").toLowerCase();
      if (!keep.test(text) || !ints.includes(name.split(" ")[0])) continue;
      out.push({ nct: p.identificationModule.nctId, title: p.identificationModule.briefTitle, status: p.statusModule?.overallStatus, results: st.hasResults, n: p.designModule?.enrollmentInfo?.count ?? null });
    }
    token = j.nextPageToken;
    if (!token) break;
  }
  return out;
}

mkdirSync("data/labels", { recursive: true });
for (const f of FEATURED) {
  const name = drugNames(f.slug.replace(/-/g, " "))[0];
  const lab = await label(name);
  const focus = {
    pregnancy: await focused(name, "pregnancy OR pregnant OR preeclampsia OR gestational OR postpartum", /pregnan|pre-?eclampsia|gestation|postpartum|obstetric|cesarean|caesarean|labor|labour|preterm/i),
    breastfeeding: await focused(name, "lactation OR breastfeeding OR breast milk", /lactat|breast ?feed|breast milk|nursing/i),
    menopause: await focused(name, "menopause OR postmenopausal OR perimenopausal", /menopaus|hot flash|vasomotor/i),
    pcos_or_skin: await focused(name, "polycystic OR acne OR hirsutism OR alopecia", /polycystic|pcos|acne|hirsut|alopecia|hair loss/i),
  };
  writeFileSync(`data/labels/${f.slug}.json`, JSON.stringify({ label: lab, focus }, null, 1));
  console.log(f.slug, lab ? "label ok" : "NO LABEL", Object.fromEntries(Object.entries(focus).map(([k, v]) => [k, `${v.length} (${v.filter((x: any) => x.results).length} w/ results)`])));
}
