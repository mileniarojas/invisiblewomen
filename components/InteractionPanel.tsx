"use client";
import { useState } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/client";

type Finding = { kind: string; severity: "high" | "moderate" | "info"; with?: string; source: string; text: string };

export function InteractionPanel({ slug, drugName, state, medNames }: { slug: string; drugName: string; state: "unconfigured" | "guest" | "incomplete" | "ready"; medNames: string[] }) {
  const all = useT();
  const t = all.ix;
  const [res, setRes] = useState<{ labelFound: boolean; findings: Finding[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const meds = medNames.filter((m) => m !== "none");

  if (state !== "ready") {
    return (
      <div className="card p-6">
        <p className="mb-3">{t.intro(drugName)}</p>
        {state === "unconfigured" ? <p className="text-sm text-muted">{t.later}</p>
          : <Link href={state === "guest" ? "/login" : "/onboarding"} className="btn btn-primary">{state === "guest" ? t.joinToCheck : t.finishToCheck}</Link>}
      </div>
    );
  }
  const run = async () => {
    setLoading(true); setErr(null);
    try {
      const r = await fetch("/api/interactions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug }) });
      const j = await r.json();
      if (!r.ok) setErr(all.community.errors[j.error] ?? t.failed); else setRes(j);
    } catch { setErr(t.failed); }
    setLoading(false);
  };
  const tone = { high: "border-l-rose bg-rose-soft/50", moderate: "border-l-plum bg-amber-soft/50", info: "border-l-sage bg-sage-soft/40" };
  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="flex-1 min-w-[14rem]">{t.yourMeds} {meds.length ? <b>{meds.join(", ")}</b> : <i>{t.noneListed}</i>} · <Link href="/profile" className="underline text-sm">{t.edit}</Link></p>
        <button className="btn btn-primary" onClick={run} disabled={loading}>{loading ? t.checking : t.check}</button>
      </div>
      {err && <p className="text-rose text-sm mt-3">{err}</p>}
      {res && (
        <div className="mt-5 space-y-3">
          {!res.labelFound && <p className="text-sm text-muted">{t.noLabel}</p>}
          {res.findings.length === 0 && <p className="text-sage font-medium">{t.clear}</p>}
          {res.findings.map((f, i) => (
            <div key={i} className={`border-l-4 rounded-r-lg p-4 ${tone[f.severity]}`}>
              <div className="font-semibold text-sm mb-1">
                {f.severity === "high" ? t.serious : f.severity === "moderate" ? t.interaction : ""}
                {f.kind === "drug" ? <span className="capitalize">{t.with(f.with ?? "")}</span> : f.kind === "pregnancy" ? t.pregnancy : f.kind === "breastfeeding" ? t.breastfeeding : t.contraception}
              </div>
              <p className="text-sm" lang="en">{f.text}</p>
              <p className="text-xs text-muted mt-1">{t.source(f.source)}</p>
            </div>
          ))}
          <p className="text-xs text-muted">{t.foot}</p>
        </div>
      )}
    </div>
  );
}
