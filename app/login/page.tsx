import { redirect } from "next/navigation";
import { getViewer } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { getT } from "@/lib/i18n/server";
import { LoginForm } from "@/components/LoginForm";

export async function generateMetadata() { return { title: (await getT()).t.login.title }; }

export default async function Login() {
  const [v, { t }] = await Promise.all([getViewer(), getT()]);
  if (v.user) redirect(v.complete ? "/my" : "/onboarding");
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-serif text-4xl mb-2">{t.login.title}</h1>
      <p className="text-muted mb-8">{t.login.intro}</p>
      {supabaseConfigured ? <LoginForm /> : <div className="card p-5 text-sm">{t.login.notConnected}</div>}
    </div>
  );
}
