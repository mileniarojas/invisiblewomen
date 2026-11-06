import { NextResponse } from "next/server";
import { getViewer } from "@/lib/supabase/server";
import { getDrug } from "@/lib/data";
import { checkInteractions } from "@/lib/interactions";

export async function POST(req: Request) {
  const { slug } = await req.json().catch(() => ({}));
  const drug = typeof slug === "string" ? await getDrug(slug) : null;
  if (!drug) return NextResponse.json({ error: "unknown_drug" }, { status: 404 });
  const v = await getViewer();
  if (!v.user) return NextResponse.json({ error: "sign_in" }, { status: 401 });
  if (!v.complete || !v.profile) return NextResponse.json({ error: "profile" }, { status: 403 });
  const result = await checkInteractions({
    drug: drug.name,
    meds: v.meds,
    pregnant: v.profile.pregnancy_status === "pregnant",
    breastfeeding: v.profile.breastfeeding,
    hormonalContraception: v.profile.hormonal_contraception,
  });
  return NextResponse.json(result);
}
