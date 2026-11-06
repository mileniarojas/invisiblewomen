"use client";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/client";

export function AccountActions() {
  const router = useRouter();
  const t = useT().profile;
  const signOut = async () => { await supabaseBrowser().auth.signOut(); router.push("/"); router.refresh(); };
  const del = async () => {
    if (!confirm(t.confirmDelete)) return;
    const r = await fetch("/api/account", { method: "DELETE" });
    if (!r.ok) return alert((await r.json()).error ?? "Couldn't delete");
    await supabaseBrowser().auth.signOut();
    router.push("/"); router.refresh();
  };
  return (
    <div className="mt-12 pt-6 border-t border-line flex flex-wrap gap-3">
      <button className="btn btn-ghost" onClick={signOut}>{t.signOut}</button>
      <button className="btn btn-ghost !text-rose" onClick={del}>{t.deleteAll}</button>
    </div>
  );
}
