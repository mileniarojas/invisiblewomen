import "server-only";
import { drugNames } from "./aliases";

// FDA label sections we read.
type Label = {
  drug_interactions?: string[];
  contraindications?: string[];
  boxed_warning?: string[];
  warnings_and_cautions?: string[];
  warnings?: string[];
  precautions?: string[];
  pregnancy?: string[];
  pregnancy_or_breast_feeding?: string[];
  nursing_mothers?: string[];
  lactation?: string[];
  use_in_specific_populations?: string[];
  openfda?: { generic_name?: string[]; brand_name?: string[] };
};

const labelCache = new Map<string, Promise<Label | null>>();

async function fetchLabel(name: string): Promise<Label | null> {
  const key = process.env.OPENFDA_API_KEY ? `&api_key=${process.env.OPENFDA_API_KEY}` : "";
  const q = encodeURIComponent(`openfda.generic_name:"${name.replace(/"/g, "")}"`);
  try {
    const res = await fetch(`https://api.fda.gov/drug/label.json?search=${q}&limit=1&sort=effective_time:desc${key}`, {
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.results?.[0] ?? null;
  } catch {
    return null;
  }
}

export function getLabel(drug: string): Promise<Label | null> {
  const k = drug.toLowerCase();
  if (!labelCache.has(k)) {
    labelCache.set(k, (async () => {
      for (const n of drugNames(k)) {
        const l = await fetchLabel(n);
        if (l) return l;
      }
      return null;
    })());
  }
  return labelCache.get(k)!;
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Sentence(s) in `texts` that mention any of `names`. */
function findMentions(texts: string[] | undefined, names: string[]): string | null {
  if (!texts?.length) return null;
  const re = new RegExp(`\\b(${names.map(esc).join("|")})\\b`, "i");
  for (const t of texts) {
    const sentences = t.split(/(?<=[.;])(?<!\b(?:St|Dr|vs|e\.g|i\.e)\.)\s+(?=[A-Z0-9])/);
    const hit = sentences.find((s) => re.test(s));
    if (hit) return hit.length > 400 ? hit.slice(0, 399) + "…" : hit;
  }
  return null;
}

function firstSentences(texts: string[] | undefined, n = 2): string | null {
  if (!texts?.length) return null;
  const s = texts.join(" ").replace(/^\s*\d+(\.\d+)*\s+[A-Z][A-Za-z ]+\s+/, "").split(/(?<=\.)\s+/).slice(0, n).join(" ");
  return s.length > 450 ? s.slice(0, 449) + "…" : s;
}

export type InteractionFinding = {
  kind: "drug" | "pregnancy" | "breastfeeding" | "contraception";
  severity: "high" | "moderate" | "info";
  with?: string;
  source: string; // drug whose FDA label the text comes from
  text: string;
};

export async function checkInteractions(input: {
  drug: string;
  meds: { name: string }[];
  pregnant: boolean;
  breastfeeding: boolean;
  hormonalContraception: boolean;
}): Promise<{ labelFound: boolean; findings: InteractionFinding[]; checked: string[] }> {
  const label = await getLabel(input.drug);
  const findings: InteractionFinding[] = [];
  const meds = input.meds.filter((m) => m.name && m.name.toLowerCase() !== "none");
  const drugLabel = input.drug;

  await Promise.all(meds.map(async (m) => {
    const medNames = drugNames(m.name);
    if (drugNames(input.drug).some((n) => medNames.includes(n))) return;
    const contra = findMentions(label?.contraindications, medNames) ?? findMentions(label?.boxed_warning, medNames);
    if (contra) {
      findings.push({ kind: "drug", severity: "high", with: m.name, source: drugLabel, text: contra });
      return;
    }
    const inter = findMentions(label?.drug_interactions, medNames)
      ?? findMentions(label?.warnings_and_cautions, medNames) ?? findMentions(label?.warnings, medNames) ?? findMentions(label?.precautions, medNames);
    if (inter) {
      findings.push({ kind: "drug", severity: "moderate", with: m.name, source: drugLabel, text: inter });
      return;
    }
    // Reverse direction: the other medicine's label mentions this drug.
    const other = await getLabel(m.name);
    const names = drugNames(input.drug);
    const rc = findMentions(other?.contraindications, names) ?? findMentions(other?.boxed_warning, names);
    const ri = rc ?? findMentions(other?.drug_interactions, names) ?? findMentions(other?.warnings_and_cautions, names) ?? findMentions(other?.warnings, names);
    if (ri) findings.push({ kind: "drug", severity: rc ? "high" : "moderate", with: m.name, source: m.name, text: ri });
  }));

  if (input.hormonalContraception) {
    const t = findMentions(label?.drug_interactions, ["contraceptive", "contraceptives", "contraception", "ethinyl estradiol", "levonorgestrel", "norethindrone"]);
    if (t) findings.push({ kind: "contraception", severity: "moderate", with: "hormonal birth control", source: drugLabel, text: t });
  }
  if (input.pregnant) {
    const t = firstSentences(label?.pregnancy ?? label?.pregnancy_or_breast_feeding, 3)
      ?? findMentions(label?.use_in_specific_populations, ["pregnancy", "pregnant", "fetal", "neonates"])
      ?? findMentions(label?.precautions, ["pregnancy", "pregnant"]) ?? findMentions(label?.warnings, ["pregnancy", "pregnant"]);
    if (t) findings.push({ kind: "pregnancy", severity: "info", source: drugLabel, text: t });
  }
  if (input.breastfeeding) {
    const t = firstSentences(label?.lactation ?? label?.nursing_mothers ?? label?.pregnancy_or_breast_feeding, 3)
      ?? findMentions(label?.use_in_specific_populations, ["breast milk", "lactation", "breastfed", "breastfeeding"])
      ?? findMentions(label?.precautions, ["nursing", "breast milk", "lactation", "breastfeeding"]);
    if (t) findings.push({ kind: "breastfeeding", severity: "info", source: drugLabel, text: t });
  }

  const order = { high: 0, moderate: 1, info: 2 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);
  return { labelFound: !!label, findings, checked: meds.map((m) => m.name) };
}
