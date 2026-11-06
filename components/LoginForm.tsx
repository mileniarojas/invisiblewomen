"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/client";

export function LoginForm() {
  const t = useT().login;
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const sb = supabaseBrowser();
    const redirectTo = `${window.location.origin}/auth/callback?next=/onboarding`;
    const { data, error } = mode === "signup"
      ? await sb.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } })
      : await sb.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setMsg({ ok: false, text: error.message });
    if (mode === "signup" && !data.session) return setMsg({ ok: true, text: t.checkEmail });
    router.push(mode === "signup" ? "/onboarding" : "/profile");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="card p-6 space-y-4">
      <div className="flex rounded-full bg-line/50 p-1 text-sm font-semibold">
        {(["signup", "signin"] as const).map((m) => (
          <button type="button" key={m} onClick={() => setMode(m)} className={`flex-1 rounded-full py-1.5 ${mode === m ? "bg-card shadow" : "text-muted"}`}>{m === "signup" ? t.create : t.signIn}</button>
        ))}
      </div>
      <div><label className="label" htmlFor="email">{t.email}</label><input id="email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></div>
      <div><label className="label" htmlFor="pw">{t.password}</label><input id="pw" type="password" required minLength={8} className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} /></div>
      <button className="btn btn-primary w-full justify-center" disabled={busy}>{busy ? "…" : mode === "signup" ? t.create : t.signIn}</button>
      {msg && <p className={`text-sm ${msg.ok ? "text-sage" : "text-rose"}`}>{msg.text}</p>}
    </form>
  );
}
