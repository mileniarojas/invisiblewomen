import { redirect } from "next/navigation";
import { getViewer } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { ProfileWizard } from "@/components/ProfileWizard";

export async function generateMetadata() { return { title: (await getT()).t.profile.onboardTitle }; }

export default async function Onboarding() {
  const [v] = await Promise.all([getViewer(), getT()]);
  if (!v.user) redirect("/login");
  if (v.complete) redirect("/my");
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      <ProfileWizard userId={v.user.id} profile={v.profile} meds={v.meds} />
    </div>
  );
}
