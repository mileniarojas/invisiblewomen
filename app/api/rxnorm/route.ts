import { NextResponse } from "next/server";

// Medication autocomplete using NIH RxNorm. Returns ingredient-level names + RxCUIs.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) return NextResponse.json({ results: [] });
  try {
    const res = await fetch(
      `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(q)}&maxEntries=12&option=1`,
      { next: { revalidate: 86400 } },
    );
    const json = await res.json();
    const cands: { rxcui: string; name?: string }[] = json.approximateGroup?.candidate ?? [];
    const seen = new Set<string>();
    const out: { rxcui: string; name: string }[] = [];
    for (const c of cands) {
      if (!c.name || seen.has(c.rxcui)) continue;
      seen.add(c.rxcui);
      out.push({ rxcui: c.rxcui, name: c.name.toLowerCase() });
      if (out.length >= 8) break;
    }
    return NextResponse.json({ results: out });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
