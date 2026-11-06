import { redirect } from "next/navigation";
import { getViewer } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/ProfileForm";
import { getT } from "@/lib/i18n/server";
import { AccountActions } from "@/components/AccountActions";

export async function generateMetadata() { return { title: (await getT()).t.profile.title }; }

export default async function Profile() {
  const [v, { t }] = await Promise.all([getViewer(), getT()]);
  if (!v.user) redirect("/login");
  if (!v.profile) redirect("/onboarding");
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif text-4xl mb-1">{t.profile.title}</h1>
      <p className="text-muted mb-8">{v.user.email}</p>
      <ProfileForm userId={v.user.id} profile={v.profile} meds={v.meds} onboarding={false} />
      <AccountActions />
    </div>
  );
}
