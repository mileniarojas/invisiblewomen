import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigured } from "./config";

export async function supabaseServer() {
  if (!supabaseConfigured) return null;
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list: { name: string; value: string; options?: CookieOptions }[]) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a Server Component: middleware refreshes the session instead.
        }
      },
    },
  });
}

/** Service-role client: bypasses RLS. Server-only, used for account deletion and caches. */
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !key) return null;
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false } });
}

export type ProfileRow = {
  user_id: string;
  display_name: string;
  birth_year: number;
  sex_at_birth: string;
  gender_identity: string | null;
  race_ethnicity: string[];
  height_cm: number | null;
  weight_kg: number | null;
  pregnancy_status: string;
  breastfeeding: boolean;
  menopause_status: string;
  hormonal_contraception: boolean;
  hormone_therapy: boolean;
  conditions: string[];
  allergies: string[];
  kidney_or_liver_disease: boolean;
  birth_control_type: string;
  smoking: string;
  surgeries: string[];
  consent_at: string;
};
export type MedRow = { id: string; rxcui: string | null; name: string; dose: string | null; kind: string };

/** Current user plus profile and meds (null-safe when Supabase isn't configured). */
export async function getViewer() {
  const sb = await supabaseServer();
  if (!sb) return { sb: null, user: null, profile: null, meds: [] as MedRow[], complete: false };
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { sb, user: null, profile: null, meds: [] as MedRow[], complete: false };
  const [{ data: profile }, { data: meds }] = await Promise.all([
    sb.from("profiles").select("*").eq("user_id", user.id).maybeSingle<ProfileRow>(),
    sb.from("profile_medications").select("id,rxcui,name,dose,kind").eq("user_id", user.id).returns<MedRow[]>(),
  ]);
  return { sb, user, profile, meds: meds ?? [], complete: Boolean(profile && (meds?.length ?? 0) > 0) };
}
