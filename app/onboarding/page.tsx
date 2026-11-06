import { redirect } from "next/navigation";
import { getViewer } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/ProfileForm";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() { return { title: (await getT()).t.profile.onboardTitle }; }

export default async function Onboarding() {
  const [v, { t }] = await Promise.all([getViewer(), getT()]);
  if (!v.user) redirect("/login");
  if (v.complete) redirect("/profile");
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs font-bold uppercase tracking-widest text-rose mb-2">{t.profile.step}</p>
      <h1 className="font-serif text-4xl mb-2">{t.profile.onboardTitle}</h1>
      <p className="text-muted mb-8">{t.profile.onboardIntro}</p>
      <ProfileForm userId={v.user.id} profile={v.profile} meds={v.meds} onboarding />
    </div>
  );
}
