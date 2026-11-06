"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { MedRow, ProfileRow } from "@/lib/supabase/server";
import { useT } from "@/lib/i18n/client";

type Med = { rxcui: string | null; name: string; dose: string | null; kind: string };
const KINDS = ["prescription", "otc", "supplement", "contraceptive", "hormone"];

export function ProfileForm({ userId, profile, meds: initialMeds, onboarding }: { userId: string; profile: ProfileRow | null; meds: MedRow[]; onboarding: boolean }) {
  const router = useRouter();
  const t = useT().profile;
  const [meds, setMeds] = useState<Med[]>(initialMeds.filter((m) => m.name !== "none"));
  const [noMeds, setNoMeds] = useState(initialMeds.some((m) => m.name === "none"));
  const [race, setRace] = useState<string[]>(profile?.race_ethnicity ?? []);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async (fd: FormData) => {
    setBusy(true); setMsg(null);
    if (!meds.length && !noMeds) { setBusy(false); return setMsg({ ok: false, text: t.needMeds }); }
    if (!fd.get("consent")) { setBusy(false); return setMsg({ ok: false, text: t.needConsent }); }
    const sb = supabaseBrowser();
    const list = (k: string) => String(fd.get(k) ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    const num = (k: string) => { const n = parseFloat(String(fd.get(k) ?? "")); return Number.isFinite(n) ? n : null; };
    const row = {
      user_id: userId,
      display_name: String(fd.get("display_name")).trim(),
      birth_year: Number(fd.get("birth_year")),
      sex_at_birth: String(fd.get("sex_at_birth")),
      gender_identity: String(fd.get("gender_identity") ?? "").trim() || null,
      race_ethnicity: race,
      height_cm: num("height_cm"),
      weight_kg: num("weight_kg"),
      pregnancy_status: String(fd.get("pregnancy_status")),
      breastfeeding: !!fd.get("breastfeeding"),
      menopause_status: String(fd.get("menopause_status")),
      hormonal_contraception: !!fd.get("hormonal_contraception") || meds.some((m) => m.kind === "contraceptive"),
      hormone_therapy: !!fd.get("hormone_therapy") || meds.some((m) => m.kind === "hormone"),
      conditions: list("conditions"),
      allergies: list("allergies"),
      kidney_or_liver_disease: !!fd.get("kidney_or_liver_disease"),
      consent_at: profile?.consent_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { error } = await sb.from("profiles").upsert(row);
    if (error) { setBusy(false); return setMsg({ ok: false, text: error.message }); }
    await sb.from("profile_medications").delete().eq("user_id", userId);
    const medRows = (noMeds ? [{ rxcui: null, name: "none", dose: null, kind: "otc" }] : meds).map((m) => ({ ...m, user_id: userId }));
    const { error: e2 } = await sb.from("profile_medications").insert(medRows);
    setBusy(false);
    if (e2) return setMsg({ ok: false, text: e2.message });
    setMsg({ ok: true, text: t.savedMsg });
    router.refresh();
    if (onboarding) router.push("/drugs");
  };

  const p = profile;
  const year = new Date().getFullYear();
  return (
    <form action={save} className="space-y-8">
      <fieldset className="card p-6 grid gap-4 sm:grid-cols-2">
        <legend className="font-serif text-xl font-semibold px-1">{t.about}</legend>
        <div><label className="label" htmlFor="dn">{t.displayName}</label><input id="dn" name="display_name" required minLength={2} maxLength={40} defaultValue={p?.display_name} className="input" placeholder={t.displayPh} /></div>
        <div><label className="label" htmlFor="by">{t.birthYear}</label><input id="by" name="birth_year" type="number" required min={1900} max={year - 13} defaultValue={p?.birth_year} className="input" /></div>
        <div><label className="label" htmlFor="sab">{t.sexAtBirth}</label>
          <select id="sab" name="sex_at_birth" required defaultValue={p?.sex_at_birth ?? "female"} className="input">
            <option value="female">{t.female}</option><option value="male">{t.male}</option><option value="intersex">{t.intersex}</option><option value="prefer_not">{t.preferNot}</option>
          </select></div>
        <div><label className="label" htmlFor="gi">{t.gender}</label><input id="gi" name="gender_identity" defaultValue={p?.gender_identity ?? ""} className="input" /></div>
        <div className="sm:col-span-2"><span className="label">{t.raceEth}</span>
          <div className="flex flex-wrap gap-2">{t.races.map((r) => (
            <label key={r} className={`chip border cursor-pointer !py-1.5 ${race.includes(r) ? "bg-plum text-paper border-plum" : "border-line"}`}>
              <input type="checkbox" className="sr-only" checked={race.includes(r)} onChange={() => setRace(race.includes(r) ? race.filter((x) => x !== r) : [...race, r])} />{r}
            </label>))}</div></div>
        <div><label className="label" htmlFor="h">{t.height}</label><input id="h" name="height_cm" type="number" min={90} max={250} step="0.1" defaultValue={p?.height_cm ?? ""} className="input" /></div>
        <div><label className="label" htmlFor="w">{t.weight}</label><input id="w" name="weight_kg" type="number" min={25} max={350} step="0.1" defaultValue={p?.weight_kg ?? ""} className="input" /></div>
      </fieldset>

      <fieldset className="card p-6 grid gap-4 sm:grid-cols-2">
        <legend className="font-serif text-xl font-semibold px-1">{t.repro}</legend>
        <div><label className="label" htmlFor="ps">{t.pregnancy}</label>
          <select id="ps" name="pregnancy_status" defaultValue={p?.pregnancy_status ?? "no"} className="input">
            <option value="no">{t.notPregnant}</option><option value="pregnant">{t.pregnant}</option><option value="trying">{t.trying}</option><option value="postpartum">{t.postpartum}</option><option value="prefer_not">{t.preferNot}</option>
          </select></div>
        <div><label className="label" htmlFor="ms">{t.menopause}</label>
          <select id="ms" name="menopause_status" defaultValue={p?.menopause_status ?? "unknown"} className="input">
            <option value="pre">{t.pre}</option><option value="peri">{t.peri}</option><option value="post">{t.post}</option><option value="unknown">{t.unsure}</option>
          </select></div>
        <label className="flex gap-2 items-center"><input type="checkbox" name="breastfeeding" defaultChecked={p?.breastfeeding} /> {t.breastfeeding}</label>
        <label className="flex gap-2 items-center"><input type="checkbox" name="hormonal_contraception" defaultChecked={p?.hormonal_contraception} /> {t.onBc}</label>
        <label className="flex gap-2 items-center"><input type="checkbox" name="hormone_therapy" defaultChecked={p?.hormone_therapy} /> {t.onHrt}</label>
      </fieldset>

      <fieldset className="card p-6 space-y-4">
        <legend className="font-serif text-xl font-semibold px-1">{t.meds}</legend>
        <p className="text-sm text-muted">{t.medsHelp}</p>
        <MedicationPicker onAdd={(m) => { setMeds([...meds, m]); setNoMeds(false); }} />
        <ul className="space-y-2">
          {meds.map((m, i) => (
            <li key={i} className="flex flex-wrap items-center gap-2 border border-line rounded-lg p-2">
              <b className="capitalize flex-1 min-w-[8rem]">{m.name}</b>
              <input aria-label={t.dose} placeholder={t.dose} className="input !w-36 !py-1" value={m.dose ?? ""} onChange={(e) => setMeds(meds.map((x, j) => j === i ? { ...x, dose: e.target.value || null } : x))} />
              <select aria-label="Type" className="input !w-auto !py-1" value={m.kind} onChange={(e) => setMeds(meds.map((x, j) => j === i ? { ...x, kind: e.target.value } : x))}>
                {KINDS.map((v) => <option key={v} value={v}>{t.kinds[v]}</option>)}
              </select>
              <button type="button" className="text-muted hover:text-rose px-2" onClick={() => setMeds(meds.filter((_, j) => j !== i))} aria-label={`${t.remove} ${m.name}`}>✕</button>
            </li>
          ))}
        </ul>
        <label className="flex gap-2 items-center text-sm"><input type="checkbox" checked={noMeds} onChange={(e) => { setNoMeds(e.target.checked); if (e.target.checked) setMeds([]); }} /> {t.noMeds}</label>
      </fieldset>

      <fieldset className="card p-6 grid gap-4 sm:grid-cols-2">
        <legend className="font-serif text-xl font-semibold px-1">{t.conditions}</legend>
        <div><label className="label" htmlFor="cond">{t.condList}</label><input id="cond" name="conditions" defaultValue={p?.conditions.join(", ")} className="input" placeholder={t.condPh} /></div>
        <div><label className="label" htmlFor="all">{t.allergies}</label><input id="all" name="allergies" defaultValue={p?.allergies.join(", ")} className="input" placeholder={t.allergyPh} /></div>
        <label className="flex gap-2 items-center sm:col-span-2"><input type="checkbox" name="kidney_or_liver_disease" defaultChecked={p?.kidney_or_liver_disease} /> {t.kidneyLiver}</label>
      </fieldset>

      <label className="flex gap-3 items-start text-sm card p-4">
        <input type="checkbox" name="consent" defaultChecked={!!p} className="mt-1" />
        <span>{t.consent} <a href="/privacy" className="underline">→</a></span>
      </label>

      <div className="flex items-center gap-3">
        <button className="btn btn-primary" disabled={busy}>{busy ? t.saving : onboarding ? t.saveContinue : t.save}</button>
        {msg && <span className={`text-sm ${msg.ok ? "text-sage" : "text-rose"}`}>{msg.text}</span>}
      </div>
    </form>
  );
}

function MedicationPicker({ onAdd }: { onAdd: (m: Med) => void }) {
  const t = useT().profile;
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ rxcui: string; name: string }[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 3) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      const r = await fetch(`/api/rxnorm?q=${encodeURIComponent(q)}`).then((x) => x.json()).catch(() => ({ results: [] }));
      setResults(r.results ?? []);
    }, 250);
  }, [q]);
  const add = (m: { rxcui: string | null; name: string }) => {
    const kind = /estradiol|levonorgestrel|norethindrone|drospirenone|etonogestrel|desogestrel|norgestimate/i.test(m.name) ? "contraceptive" : "prescription";
    onAdd({ rxcui: m.rxcui, name: m.name, dose: null, kind });
    setQ(""); setResults([]);
  };
  return (
    <div className="relative">
      <label className="label" htmlFor="medq">{t.addMed}</label>
      <input id="medq" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.addPh}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (results[0]) add(results[0]); else if (q.trim()) add({ rxcui: null, name: q.trim().toLowerCase() }); } }} autoComplete="off" />
      {results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full card shadow-lg overflow-hidden">
          {results.map((r) => <li key={r.rxcui}><button type="button" className="w-full text-left px-3 py-2 hover:bg-plum-soft capitalize" onClick={() => add(r)}>{r.name} <span className="text-xs text-muted">RxCUI {r.rxcui}</span></button></li>)}
        </ul>
      )}
      <p className="text-xs text-muted mt-1">{t.medsSource}</p>
    </div>
  );
}
