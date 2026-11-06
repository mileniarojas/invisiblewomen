import { NextResponse } from "next/server";
import { getViewer, supabaseAdmin } from "@/lib/supabase/server";

export async function DELETE() {
  const v = await getViewer();
  if (!v.user || !v.sb) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  // Profile delete cascades to medications, posts, likes, saves, reports.
  const { error } = await v.sb.from("profiles").delete().eq("user_id", v.user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const admin = supabaseAdmin();
  if (admin) await admin.auth.admin.deleteUser(v.user.id);
  return NextResponse.json({ ok: true, authDeleted: !!admin });
}
