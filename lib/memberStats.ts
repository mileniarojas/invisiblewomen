import "server-only";
// Community observational data: what members who took a medicine report, counted across all their posts.
// Percentages are only shown once enough women have reported, so no one can be singled out and
// tiny numbers don't look like findings.
import { supabaseServer } from "./supabase/server";

export const MIN_REPORTS = 5;
export type MemberStats = { members: number; effects: { name: string; count: number; pct: number }[]; pregnantMembers: number };

export async function memberStats(slug: string): Promise<MemberStats | null> {
  const sb = await supabaseServer();
  if (!sb) return null;
  const { data } = await sb.from("experiences").select("user_id,side_effects,public_context").eq("drug_slug", slug).limit(5000);
  const rows = data ?? [];
  // One woman = one report per medicine, even if she posted several times.
  const byUser = new Map<string, { effects: Set<string>; pregnant: boolean }>();
  for (const r of rows) {
    const u = byUser.get(r.user_id) ?? { effects: new Set<string>(), pregnant: false };
    for (const e of r.side_effects ?? []) u.effects.add(String(e).trim().toLowerCase());
    if ((r.public_context as Record<string, unknown>)?.pregnant) u.pregnant = true;
    byUser.set(r.user_id, u);
  }
  const members = byUser.size;
  const counts = new Map<string, number>();
  for (const u of byUser.values()) for (const e of u.effects) if (e) counts.set(e, (counts.get(e) ?? 0) + 1);
  const effects = [...counts.entries()]
    .map(([name, count]) => ({ name, count, pct: Math.round((count / Math.max(members, 1)) * 100) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  return { members, effects, pregnantMembers: [...byUser.values()].filter((u) => u.pregnant).length };
}
