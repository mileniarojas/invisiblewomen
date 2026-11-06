"use server";
import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/supabase/server";
import { getDrug } from "@/lib/data";

type Result = { ok: true } | { ok: false; error: string };

async function gate() {
  const v = await getViewer();
  if (!v.sb) return { error: "not_connected" } as const;
  if (!v.user) return { error: "sign_in" } as const;
  if (!v.complete || !v.profile) return { error: "profile" } as const;
  return { v } as const;
}

const ageBand = (y: number) => {
  const a = new Date().getFullYear() - y;
  const lo = Math.floor(a / 10) * 10;
  return `${lo}–${lo + 9}`;
};

export async function postExperience(slug: string, form: FormData): Promise<Result> {
  const g = await gate();
  if ("error" in g) return { ok: false, error: g.error! };
  const { v } = g;
  if (!(await getDrug(slug))) return { ok: false, error: "unknown_drug" };
  const body = String(form.get("body") ?? "").trim();
  if (body.length < 10) return { ok: false, error: "too_short" };
  const severity = Number(form.get("severity")) || null;
  const side_effects = String(form.get("side_effects") ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 12);
  const p = v.profile!;
  const ctx: Record<string, string | boolean> = {};
  if (form.get("share_age")) ctx.age_band = ageBand(p.birth_year);
  if (form.get("share_repro")) {
    if (p.pregnancy_status === "pregnant") ctx.pregnant = true;
    if (p.breastfeeding) ctx.breastfeeding = true;
    if (p.menopause_status !== "unknown") ctx.menopause = p.menopause_status;
    if (p.hormonal_contraception) ctx.hormonal_bc = true;
    if (p.hormone_therapy) ctx.hrt = true;
  }
  if (form.get("share_race") && p.race_ethnicity.length) ctx.race = p.race_ethnicity.join(", ");
  if (form.get("share_meds")) ctx.other_meds = String(v.meds.filter((m) => m.name !== "none").length);

  const { error } = await v.sb!.from("experiences").insert({
    user_id: v.user!.id, drug_slug: slug, body: body.slice(0, 4000), severity, side_effects,
    duration: String(form.get("duration") ?? "").slice(0, 60) || null,
    public_context: ctx, author_name: p.display_name,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/drugs/${slug}`);
  return { ok: true };
}

export async function toggleLike(slug: string, experienceId: string, liked: boolean): Promise<Result> {
  const g = await gate();
  if ("error" in g) return { ok: false, error: g.error! };
  const { v } = g;
  const q = liked
    ? v.sb!.from("likes").delete().eq("user_id", v.user!.id).eq("experience_id", experienceId)
    : v.sb!.from("likes").insert({ user_id: v.user!.id, experience_id: experienceId });
  const { error } = await q;
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/drugs/${slug}`);
  return { ok: true };
}

export async function toggleSave(slug: string, saved: boolean): Promise<Result> {
  const g = await gate();
  if ("error" in g) return { ok: false, error: g.error! };
  const { v } = g;
  const q = saved
    ? v.sb!.from("saves").delete().eq("user_id", v.user!.id).eq("drug_slug", slug)
    : v.sb!.from("saves").insert({ user_id: v.user!.id, drug_slug: slug });
  const { error } = await q;
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/drugs/${slug}`);
  revalidatePath("/saved");
  return { ok: true };
}

export async function deleteExperience(slug: string, id: string): Promise<Result> {
  const g = await gate();
  if ("error" in g) return { ok: false, error: g.error! };
  const { error } = await g.v.sb!.from("experiences").delete().eq("id", id).eq("user_id", g.v.user!.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/drugs/${slug}`);
  return { ok: true };
}

export async function reportExperience(slug: string, id: string): Promise<Result> {
  const g = await gate();
  if ("error" in g) return { ok: false, error: g.error! };
  const { error } = await g.v.sb!.from("reports").insert({ user_id: g.v.user!.id, experience_id: id, reason: "user report" });
  if (error && !/duplicate/i.test(error.message)) return { ok: false, error: error.message };
  revalidatePath(`/drugs/${slug}`);
  return { ok: true };
}
