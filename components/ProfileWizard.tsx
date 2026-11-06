"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useLang, useT } from "@/lib/i18n/client";
import type { MedRow, ProfileRow } from "@/lib/supabase/server";
import { MedicationPicker, type Med } from "./ProfileForm";

const HORMONAL_BC = ["pill", "patch", "ring", "shot", "implant", "hormonal_iud"];
const CONDITION_KEYS = ["heart", "high_bp", "diabetes", "thyroid", "kidney", "liver", "mental_health", "seizures", "cancer", "autoimmune", "pcos", "endometriosis", "migraine", "asthma", "osteoporosis"];

type Answers = {
  display_name: string; birth_year: string;
  units: "us" | "metric"; ft: string; inch: string; lb: string; cm: string; kg: string;
  race: string[]; hispanic: "yes" | "no" | "prefer_not" | "";
  sex_at_birth: string; gender_identity: string;
  pregnancy_status: string; breastfeeding: boolean;
  menopause_status: string; surgeries: string[];
  bc_type: string; menoHrt: boolean; genderHrt: boolean;
  condKeys: string[]; conditionsOther: string; allergies: string; smoking: string;
  meds: Med[]; noMeds: boolean; consent: boolean;
};

function initial(p: ProfileRow | null, meds: MedRow[], lang: string): Answers {
  const cm = p?.height_cm ?? null, kg = p?.weight_kg ?? null;
  const totalIn = cm ? cm / 2.54 : null;
  const conds = p?.conditions ?? [];
  return {
    display_name: p?.display_name ?? "", birth_year: p?.birth_year ? String(p.birth_year) : "",
    units: lang === "es" ? "metric" : "us",
    ft: totalIn ? String(Math.floor(totalIn / 12)) : "", inch: totalIn ? String(Math.round(totalIn % 12)) : "",
    lb: kg ? String(Math.round(kg * 2.2046)) : "", cm: cm ? String(Math.round(cm)) : "", kg: kg ? String(Math.round(kg)) : "",
    race: (p?.race_ethnicity ?? []).filter((r) => r !== "hispanic"),
    hispanic: p?.race_ethnicity?.includes("hispanic") ? "yes" : p ? "no" : "",
    sex_at_birth: p?.sex_at_birth ?? "female", gender_identity: p?.gender_identity ?? "",
    pregnancy_status: p?.pregnancy_status ?? "no", breastfeeding: p?.breastfeeding ?? false,
    menopause_status: p?.menopause_status ?? "unknown", surgeries: p?.surgeries ?? [],
    bc_type: p?.birth_control_type ?? (p?.hormonal_contraception ? "pill" : "none"), menoHrt: p?.hormone_therapy ?? false, genderHrt: false,
    condKeys: conds.filter((c) => CONDITION_KEYS.includes(c)), conditionsOther: conds.filter((c) => !CONDITION_KEYS.includes(c)).join(", "),
    allergies: p?.allergies.join(", ") ?? "", smoking: p?.smoking ?? "never",
    meds: meds.filter((m) => m.name !== "none"), noMeds: meds.some((m) => m.name === "none"), consent: !!p,
  };
}

const num = (x: string) => { const n = parseFloat(x); return Number.isFinite(n) ? n : null; };

function bodyMetric(a: Answers) {
  if (a.units === "metric") return { cm: num(a.cm), kg: num(a.kg) };
  const ft = num(a.ft), inch = num(a.inch) ?? 0, lb = num(a.lb);
  return { cm: ft !== null ? Math.round((ft * 12 + inch) * 2.54 * 10) / 10 : null, kg: lb !== null ? Math.round((lb / 2.2046) * 10) / 10 : null };
}

function Choice({ options, value, onChange, multi, cols = 2 }: { options: [string, string][]; value: string | string[]; onChange: (v: string) => void; multi?: boolean; cols?: 1 | 2 }) {
  return (
    <div className={`grid gap-2 ${cols === 2 ? "sm:grid-cols-2" : ""}`} role={multi ? "group" : "radiogroup"}>
      {options.map(([v, l]) => {
        const on = Array.isArray(value) ? value.includes(v) : value === v;
        return (
          <button key={v} type="button" role={multi ? "checkbox" : "radio"} aria-checked={on} onClick={() => onChange(v)}
            className={`text-left rounded-xl border px-4 py-3 transition ${on ? "border-deep bg-rose-soft/70 font-medium" : "border-line bg-card hover:border-rose"}`}>
            <span className="mr-2" aria-hidden>{on ? (multi ? "☑" : "◉") : multi ? "☐" : "○"}</span>{l}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={value} onClick={() => onChange(!value)}
      className={`w-full text-left rounded-xl border px-4 py-3 transition ${value ? "border-deep bg-rose-soft/70 font-medium" : "border-line bg-card hover:border-rose"}`}>
      <span className="mr-2" aria-hidden>{value ? "☑" : "☐"}</span>{label}
    </button>
  );
}

const toggleIn = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export function ProfileWizard({ userId, profile, meds, doneHref = "/my", preview = false }: { userId: string; profile: ProfileRow | null; meds: MedRow[]; doneHref?: string; preview?: boolean }) {
  const all = useT(), w = all.wizard, pt = all.profile, lang = useLang();
  const router = useRouter();
  const [a, setA] = useState<Answers>(() => initial(profile, meds, lang));
  const [step, setStep] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Answers>(k: K, v: Answers[K]) => setA((x) => ({ ...x, [k]: v }));
  const { cm, kg } = bodyMetric(a);
  const bmi = cm && kg ? Math.round((kg / (cm / 100) ** 2) * 10) / 10 : null;
  const year = new Date().getFullYear();
  const maleAtBirth = a.sex_at_birth === "male";

  const allSteps: { q: string; help?: string; optional?: boolean; show?: boolean; valid?: () => string | null; body: React.ReactNode }[] = [
    { q: w.aboutQ, help: w.nameHelp,
      valid: () => (a.display_name.trim().length < 2 || a.display_name.trim().length > 40 ? w.needName : !(Number(a.birth_year) >= 1900 && Number(a.birth_year) <= year - 13) ? w.needYear : null),
      body: (
        <div className="space-y-5">
          <label className="block"><span className="label">{w.nameQ}</span><input autoFocus className="input !text-lg !py-3" value={a.display_name} onChange={(e) => set("display_name", e.target.value)} placeholder={pt.displayPh} maxLength={40} /></label>
          <label className="block"><span className="label">{w.birthQ}</span><input inputMode="numeric" className="input !text-lg !py-3 max-w-[10rem]" value={a.birth_year} onChange={(e) => set("birth_year", e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="1990" /></label>
        </div>
      ) },
    { q: w.bodyQ, help: w.bodyHelp, optional: true,
      body: (
        <div className="space-y-4">
          <div className="flex gap-2">
            {(["us", "metric"] as const).map((u) => <button key={u} type="button" className="pill-tab" aria-selected={a.units === u} onClick={() => set("units", u)}>{w[u]}</button>)}
          </div>
          {a.units === "us" ? (
            <div className="flex flex-wrap gap-3 items-end">
              <label className="text-sm">{w.ft}<input inputMode="numeric" className="input w-20 mt-1" value={a.ft} onChange={(e) => set("ft", e.target.value)} /></label>
              <label className="text-sm">{w.inch}<input inputMode="numeric" className="input w-20 mt-1" value={a.inch} onChange={(e) => set("inch", e.target.value)} /></label>
              <label className="text-sm ml-4">{w.lb}<input inputMode="numeric" className="input w-28 mt-1" value={a.lb} onChange={(e) => set("lb", e.target.value)} /></label>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3 items-end">
              <label className="text-sm">{w.cm}<input inputMode="numeric" className="input w-28 mt-1" value={a.cm} onChange={(e) => set("cm", e.target.value)} /></label>
              <label className="text-sm">{w.kg}<input inputMode="numeric" className="input w-28 mt-1" value={a.kg} onChange={(e) => set("kg", e.target.value)} /></label>
            </div>
          )}
          {bmi && bmi > 10 && bmi < 80 && <p className="text-sm text-muted">{w.bmi(bmi)}</p>}
        </div>
      ) },
    { q: w.raceQ, help: w.raceHelp, optional: true,
      body: (
        <div className="space-y-6">
          <Choice multi options={Object.entries(all.raceOptions)} value={a.race}
            onChange={(v) => set("race", v === "prefer_not" ? ["prefer_not"] : toggleIn(a.race.filter((x) => x !== "prefer_not"), v))} />
          <div>
            <p className="font-medium mb-2">{w.hispQ}</p>
            <Choice options={[["yes", w.yes], ["no", w.no], ["prefer_not", w.preferNot]]} value={a.hispanic} onChange={(v) => set("hispanic", v as Answers["hispanic"])} />
          </div>
        </div>
      ) },
    { q: w.sexQ,
      body: (
        <div className="space-y-6">
          <Choice options={[["female", pt.female], ["male", pt.male], ["intersex", pt.intersex], ["prefer_not", pt.preferNot]]} value={a.sex_at_birth} onChange={(v) => set("sex_at_birth", v)} />
          <label className="block"><span className="label">{w.genderQ}</span><input className="input" value={a.gender_identity} onChange={(e) => set("gender_identity", e.target.value)} /></label>
        </div>
      ) },
    { q: w.pregQ, show: !maleAtBirth,
      body: (
        <div className="space-y-6">
          <Choice options={[["no", pt.notPregnant], ["pregnant", pt.pregnant], ["trying", pt.trying], ["postpartum", pt.postpartum], ["prefer_not", pt.preferNot]]} value={a.pregnancy_status} onChange={(v) => set("pregnancy_status", v)} />
          <div><p className="font-medium mb-2">{w.bfQ}</p><Choice options={[["yes", w.yes], ["no", w.no]]} value={a.breastfeeding ? "yes" : "no"} onChange={(v) => set("breastfeeding", v === "yes")} /></div>
        </div>
      ) },
    { q: w.periodsQ, show: !maleAtBirth,
      body: (
        <div className="space-y-6">
          <Choice options={[["pre", pt.pre], ["peri", pt.peri], ["post", pt.post], ["unknown", pt.unsure]]} value={a.menopause_status} onChange={(v) => set("menopause_status", v)} />
          <div className="space-y-2">
            <p className="font-medium">{w.surgeryQ} <span className="text-muted font-normal text-sm">({w.optional})</span></p>
            <Choice multi options={Object.entries(w.surgeries)} value={a.surgeries} onChange={(v) => set("surgeries", toggleIn(a.surgeries, v))} />
          </div>
        </div>
      ) },
    { q: maleAtBirth ? w.otherHormonesQ : w.bcQ,
      body: (
        <div className="space-y-6">
          {!maleAtBirth && <Choice options={Object.entries(w.bcTypes)} value={a.bc_type} onChange={(v) => set("bc_type", v)} />}
          <div className="space-y-2">
            {!maleAtBirth && <p className="font-medium">{w.otherHormonesQ}</p>}
            <Toggle label={w.menoHrt} value={a.menoHrt} onChange={(v) => set("menoHrt", v)} />
            <Toggle label={w.genderHrt} value={a.genderHrt} onChange={(v) => set("genderHrt", v)} />
          </div>
        </div>
      ) },
    { q: w.conditionsQ, help: w.conditionsHelp, optional: true,
      body: (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {Object.entries(w.conditionOptions).map(([k, l]) => {
              const on = a.condKeys.includes(k);
              return (
                <button key={k} type="button" role="checkbox" aria-checked={on} onClick={() => set("condKeys", toggleIn(a.condKeys, k))}
                  className={`rounded-full border px-4 py-2 text-sm transition ${on ? "border-deep bg-deep text-paper" : "border-line bg-card hover:border-rose"}`}>{l}</button>
              );
            })}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="label">{w.otherConditions}</span><input className="input" value={a.conditionsOther} onChange={(e) => set("conditionsOther", e.target.value)} /></label>
            <label className="block"><span className="label">{pt.allergies}</span><input className="input" value={a.allergies} onChange={(e) => set("allergies", e.target.value)} placeholder={pt.allergyPh} /></label>
          </div>
          <div>
            <p className="font-medium mb-2">{w.smokeQ}</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(w.smoke).map(([k, l]) => (
                <button key={k} type="button" role="radio" aria-checked={a.smoking === k} onClick={() => set("smoking", k)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${a.smoking === k ? "border-deep bg-deep text-paper" : "border-line bg-card hover:border-rose"}`}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      ) },
    { q: w.medsQ, help: w.medsHelp, valid: () => (a.meds.length || a.noMeds ? null : w.needMeds),
      body: (
        <div className="space-y-4">
          <MedicationPicker onAdd={(m) => setA((x) => ({ ...x, meds: [...x.meds, m], noMeds: false }))} />
          <ul className="space-y-2">
            {a.meds.map((m, i) => (
              <li key={`${m.name}-${i}`} className="flex items-center gap-3 rounded-xl border border-line bg-card px-4 py-3">
                <b className="capitalize flex-1">{m.name}</b>
                <button type="button" className="text-muted hover:text-rose" aria-label={`${pt.remove} ${m.name}`} onClick={() => set("meds", a.meds.filter((_, j) => j !== i))}>✕</button>
              </li>
            ))}
          </ul>
          <Toggle label={pt.noMeds} value={a.noMeds} onChange={(v) => setA((x) => ({ ...x, noMeds: v, meds: v ? [] : x.meds }))} />
        </div>
      ) },
    { q: w.reviewQ, help: w.reviewHelp, valid: () => (a.consent ? null : w.needConsent),
      body: (
        <div className="space-y-4">
          <dl className="rounded-xl border border-line bg-card divide-y divide-line text-sm">
            {[
              [pt.displayName, a.display_name], [pt.birthYear, a.birth_year],
              ["BMI", bmi ? String(bmi) : "—"],
              [pt.raceEth, [...a.race.map((r) => all.raceOptions[r]), a.hispanic === "yes" ? w.hispQ.replace(/[¿?]/g, "") : null].filter(Boolean).join(", ") || "—"],
              [pt.conditions, [...a.condKeys.map((c) => w.conditionOptions[c]), a.conditionsOther].filter(Boolean).join(", ") || "—"],
              [pt.meds, a.noMeds ? pt.noMeds : a.meds.map((m) => m.name).join(", ")],
            ].map(([k, v]) => <div key={k} className="grid grid-cols-[9rem_1fr] gap-3 px-4 py-3"><dt className="text-muted">{k}</dt><dd>{v}</dd></div>)}
          </dl>
          <Toggle label={pt.consent} value={a.consent} onChange={(v) => set("consent", v)} />
        </div>
      ) },
  ];
  const steps = allSteps.filter((s) => s.show !== false);
  const cur = steps[Math.min(step, steps.length - 1)];
  const last = step >= steps.length - 1;

  const save = async () => {
    if (preview) return router.push("/my?preview=1"); // development preview: nothing is saved
    setBusy(true); setErr(null);
    const sb = supabaseBrowser();
    const list = (x: string) => x.split(",").map((s) => s.trim()).filter(Boolean);
    const race = [...a.race, ...(a.hispanic === "yes" ? ["hispanic"] : [])];
    const { error } = await sb.from("profiles").upsert({
      user_id: userId, display_name: a.display_name.trim(), birth_year: Number(a.birth_year),
      sex_at_birth: a.sex_at_birth, gender_identity: a.gender_identity.trim() || null, race_ethnicity: race,
      height_cm: cm, weight_kg: kg,
      pregnancy_status: maleAtBirth ? "no" : a.pregnancy_status, breastfeeding: !maleAtBirth && a.breastfeeding,
      menopause_status: maleAtBirth ? "unknown" : a.menopause_status, surgeries: maleAtBirth ? [] : a.surgeries,
      birth_control_type: maleAtBirth ? "none" : a.bc_type,
      hormonal_contraception: (!maleAtBirth && HORMONAL_BC.includes(a.bc_type)) || a.meds.some((m) => m.kind === "contraceptive"),
      hormone_therapy: a.menoHrt || a.genderHrt || a.meds.some((m) => m.kind === "hormone"),
      conditions: [...a.condKeys, ...list(a.conditionsOther)], allergies: list(a.allergies),
      kidney_or_liver_disease: a.condKeys.includes("kidney") || a.condKeys.includes("liver"), smoking: a.smoking,
      consent_at: profile?.consent_at ?? new Date().toISOString(), updated_at: new Date().toISOString(),
    });
    if (error) { setBusy(false); return setErr(error.message); }
    await sb.from("profile_medications").delete().eq("user_id", userId);
    const rows = (a.noMeds ? [{ rxcui: null, name: "none", dose: null, kind: "otc" }] : a.meds).map((m) => ({ ...m, user_id: userId }));
    const { error: e2 } = await sb.from("profile_medications").insert(rows);
    setBusy(false);
    if (e2) return setErr(e2.message);
    router.push(doneHref);
    router.refresh();
  };

  const next = () => {
    const problem = cur.valid?.() ?? null;
    if (problem) return setErr(problem);
    setErr(null);
    if (last) save(); else setStep(step + 1);
  };

  return (
    <div>
      <div className="flex items-center justify-between text-sm text-muted mb-2">
        <span>{w.stepOf(Math.min(step, steps.length - 1) + 1, steps.length)}</span>
        {cur.optional && <span className="chip bg-sage-soft text-sage">{w.optional}</span>}
      </div>
      <div className="h-1.5 rounded-full bg-rose-soft overflow-hidden mb-10" aria-hidden>
        <div className="h-full bg-deep transition-all" style={{ width: `${((Math.min(step, steps.length - 1) + 1) / steps.length) * 100}%` }} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); next(); }}>
        <h2 className="font-serif text-3xl sm:text-4xl text-deep">{cur.q}</h2>
        {cur.help && <p className="text-muted mt-2 mb-6">{cur.help}</p>}
        <div className={cur.help ? "" : "mt-6"}>{cur.body}</div>
        {err && <p className="text-rose text-sm mt-4" role="alert">{err}</p>}
        <div className="flex items-center justify-between gap-4 mt-10">
          <button type="button" className="text-deep font-medium disabled:opacity-0" disabled={step === 0} onClick={() => { setErr(null); setStep(step - 1); }}>← {w.back}</button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>{busy ? w.saving : last ? w.finish : w.next}</button>
        </div>
      </form>
    </div>
  );
}
