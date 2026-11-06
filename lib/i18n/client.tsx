"use client";
import { createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { dicts, type Lang } from "./index";

const Ctx = createContext<Lang>("en");
export const I18nProvider = ({ lang, children }: { lang: Lang; children: React.ReactNode }) => <Ctx.Provider value={lang}>{children}</Ctx.Provider>;
export const useLang = () => useContext(Ctx);
export const useT = () => dicts[useContext(Ctx)];

export function LanguageSwitch() {
  const lang = useLang();
  const router = useRouter();
  const next: Lang = lang === "en" ? "es" : "en";
  return (
    <button
      className="btn btn-ghost !py-1.5 !px-2.5 whitespace-nowrap"
      lang={next}
      aria-label={next === "es" ? "Ver en español" : "View in English"}
      onClick={() => { document.cookie = `lang=${next}; path=/; max-age=31536000; samesite=lax`; router.refresh(); }}
    >
      <span aria-hidden>🌐</span><span className="hidden sm:inline">{dicts[lang].switchTo}</span><span className="sm:hidden">{next.toUpperCase()}</span>
    </button>
  );
}
