import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getViewer, type MedRow } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { ageOf, bmiOf, type ProfileLike } from "@/lib/personal";
import { MedResult, MedSkeleton } from "@/components/MedResult";
import { StatusDot } from "@/components/StatusDot";

export async function generateMetadata() { return { title: (await getT()).t.my.title }; }

// Sample profiles for local development only (Supabase isn't needed to preview the page).
const SAMPLES: Record<string, { profile: ProfileLike & { display_name: string }; meds: MedRow[] }> = {
  "1": {
    profile: { display_name: "Maya", birth_year: new Date().getFullYear() - 34, sex_at_birth: "female", race_ethnicity: ["black"], height_cm: 165, weight_kg: 86,
      pregnancy_status: "no", breastfeeding: false, menopause_status: "pre", hormonal_contraception: true, hormone_therapy: false, kidney_or_liver_disease: false },
    meds: [
      { id: "1", rxcui: null, name: "sertraline", dose: null, kind: "prescription" },
      { id: "2", rxcui: null, name: "zolpidem", dose: null, kind: "prescription" },
      { id: "3", rxcui: null, name: "yaz", dose: null, kind: "contraceptive" },
    ],
  },
  "2": {
    profile: { display_name: "Rosa", birth_year: new Date().getFullYear() - 68, sex_at_birth: "female", race_ethnicity: ["white", "hispanic"], height_cm: 158, weight_kg: 74,
      pregnancy_status: "no", breastfeeding: false, menopause_status: "post", hormonal_contraception: false, hormone_therapy: true, kidney_or_liver_disease: true },
    meds: [
      { id: "1", rxcui: null, name: "atorvastatin", dose: null, kind: "prescription" },
      { id: "2", rxcui: null, name: "lisinopril", dose: null, kind: "prescription" },
      { id: "3", rxcui: null, name: "levothyroxine", dose: null, kind: "prescription" },
    ],
  },
};

export default async function My({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const [{ t }, v, sp] = await Promise.all([getT(), getViewer(), searchParams]);
  const sample = process.env.NODE_ENV === "development" && sp.preview ? SAMPLES[sp.preview] : undefined;
  if (!sample) {
    if (!v.user) redirect("/login");
    if (!v.complete || !v.profile) redirect("/onboarding");
  }
  const profile = sample?.profile ?? v.profile!;
  const meds = (sample?.meds ?? v.meds).filter((m) => m.name !== "none");
  const age = ageOf(profile), bmi = bmiOf(profile);
  const chips = [
    t.my.age(age), bmi ? t.my.bmi(bmi) : null,
    ...profile.race_ethnicity.filter((r) => r !== "prefer_not").map((r) => (r === "hispanic" ? t.wizard.hispQ.replace(/[¿?]/g, "") : t.raceOptions[r])),
    profile.pregnancy_status === "pregnant" ? t.community.chips.pregnant : null,
    profile.breastfeeding ? t.community.chips.breastfeeding : null,
    ["pre", "peri", "post"].includes(profile.menopause_status) ? t.community.chips[profile.menopause_status as "pre" | "peri" | "post"] : null,
    profile.hormonal_contraception ? t.community.chips.bc : null,
    profile.hormone_therapy ? t.community.chips.hrt : null,
  ].filter(Boolean) as string[];

  return (
    <div>
      <section className="bg-paper">
        <div className="mx-auto max-w-5xl px-4 pt-10 pb-12">
          {sample && <p className="text-xs rounded-lg bg-amber-soft px-3 py-2 mb-6 inline-block">{t.my.preview}</p>}
          <h1 className="font-serif text-5xl sm:text-6xl text-deep">{t.my.title}</h1>
          <p className="mt-3 text-lg">{t.my.intro}</p>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="font-semibold mr-1">{profile.display_name}:</span>
            {chips.map((c) => <span key={c} className="chip bg-card border border-line !py-1 !px-3 !font-medium">{c}</span>)}
            <Link href="/profile" className="text-sm text-deep underline underline-offset-4 ml-2 hover:text-rose">{t.my.edit}</Link>
          </div>
          <ul className="flex flex-wrap gap-4 mt-6 text-xs text-muted" aria-label="Legend">
            {(["excluded", "limited", "unknown", "included"] as const).map((k) => <li key={k} className="flex items-center gap-1.5"><StatusDot s={k} />{t.my.legend[k]}</li>)}
          </ul>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 py-12 space-y-6">
        {meds.length === 0 && <p className="text-muted">{t.my.noMeds} <Link href="/profile" className="underline">{t.my.edit}</Link></p>}
        {meds.map((m) => (
          <Suspense key={m.id} fallback={<MedSkeleton name={m.name} />}>
            <MedResult med={m} profile={profile} />
          </Suspense>
        ))}
      </section>
    </div>
  );
}

