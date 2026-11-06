import "server-only";
import { cookies, headers } from "next/headers";
import { dicts, isLang, type Lang } from "./index";

/** Language from the `lang` cookie, else the browser's Accept-Language, else English. */
export async function getLang(): Promise<Lang> {
  const c = (await cookies()).get("lang")?.value;
  if (isLang(c)) return c;
  const al = (await headers()).get("accept-language") ?? "";
  return /^es\b/i.test(al.trim()) ? "es" : "en";
}
export async function getT() {
  const lang = await getLang();
  return { lang, t: dicts[lang] };
}
