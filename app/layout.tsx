import type { Metadata } from "next";
import Link from "next/link";
import { Tenor_Sans, Jost } from "next/font/google";
import { getViewer } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { I18nProvider, LanguageSwitch } from "@/lib/i18n/client";
import "./globals.css";

const display = Tenor_Sans({ subsets: ["latin"], weight: "400", variable: "--font-display" });
const body = Jost({ subsets: ["latin"], variable: "--font-body" });

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: { default: t.meta.title, template: "%s · InvisibleWoman" }, description: t.meta.description };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [{ user, profile }, { lang, t }] = await Promise.all([getViewer(), getT()]);
  return (
    <html lang={lang} className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen flex flex-col">
        <I18nProvider lang={lang}>
          <div className="bg-deep text-paper text-center text-xs sm:text-sm py-2 px-4">{t.bar}</div>
          <header className="border-b border-line bg-card sticky top-0 z-20">
            <nav className="mx-auto max-w-6xl px-4 h-16 grid grid-cols-[auto_1fr_auto] items-center gap-4">
              <Link href="/" className="flex items-center gap-2 font-serif text-2xl shrink-0">
                <Logo /> <span className="hidden min-[420px]:inline lowercase tracking-wide">invisible<span className="text-rose">woman</span></span>
              </Link>
              <div className="hidden lg:flex justify-center gap-6 xl:gap-8 text-xs font-semibold uppercase tracking-[0.12em] whitespace-nowrap">
                <Link href="/drugs" className="hover:text-rose">{t.nav.drugs}</Link>
                <Link href="/pregnancy" className="hover:text-rose">{t.nav.pregnancy}</Link>
                <Link href="/community" className="hover:text-rose">{t.nav.community}</Link>
                {user && <Link href="/my" className="hover:text-rose">{t.my.title}</Link>}
              </div>
              <div className="flex items-center gap-2 justify-end col-start-3">
                <Link href={user ? "/my" : "/drugs"} className="lg:hidden text-xs font-semibold uppercase tracking-wider px-1">{user ? t.my.title : t.nav.drugsShort}</Link>
                <LanguageSwitch />
                {user ? (
                  <Link href={profile ? "/profile" : "/onboarding"} className="hidden sm:inline-flex btn btn-ghost !py-1.5 !px-3 whitespace-nowrap">{profile?.display_name ?? t.nav.finishProfile}</Link>
                ) : (
                  <Link href="/login" className="btn btn-primary !py-2 !px-4 whitespace-nowrap">{t.nav.join}</Link>
                )}
              </div>
            </nav>
            <div className="lg:hidden border-t border-line overflow-x-auto">
              <div className="flex gap-5 px-4 py-2 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
                <Link href="/pregnancy" className="hover:text-rose">{t.nav.pregnancy}</Link>
                <Link href="/community" className="hover:text-rose">{t.nav.community}</Link>
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-line mt-20">
            <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted grid gap-4 sm:grid-cols-[2fr_1fr]">
              <p>{t.footer.disclaimer}</p>
              <div className="flex gap-4 sm:justify-end">
                <Link href="/about" className="hover:text-rose">{t.footer.methods}</Link>
                <Link href="/privacy" className="hover:text-rose">{t.footer.privacy}</Link>
              </div>
            </div>
          </footer>
        </I18nProvider>
      </body>
    </html>
  );
}

function Logo() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
      <circle cx="16" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
      <path d="M6 29c1.5-6 5.5-9 10-9s8.5 3 10 9" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
      <circle cx="16" cy="11" r="2" className="fill-rose" />
    </svg>
  );
}
