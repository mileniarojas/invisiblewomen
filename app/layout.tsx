import type { Metadata } from "next";
import Link from "next/link";
import { Tenor_Sans, DM_Sans } from "next/font/google";
import { getViewer } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { I18nProvider } from "@/lib/i18n/client";
import "./globals.css";

const display = Tenor_Sans({ subsets: ["latin"], weight: "400", variable: "--font-display" });
const body = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-body" });

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: { default: t.meta.title, template: "%s · invisiblewomen" }, description: t.meta.description, icons: { icon: "/logo.webp" } };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [{ user, profile, complete }, { lang, t }] = await Promise.all([getViewer(), getT()]);
  const links: [string, string][] = [["/#how", t.nav.how], ["/drugs", t.nav.drugs], ["/pregnancy", t.nav.pregnancy], ["/community", t.nav.community]];
  return (
    <html lang={lang} className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen flex flex-col">
        <I18nProvider lang={lang}>
          <header className="border-b border-line bg-paper/95 backdrop-blur sticky top-0 z-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 h-[76px] flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3 shrink-0" aria-label="invisiblewomen home">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.webp" alt="" width={34} height={39} className="w-[30px] h-auto" />
                <span className="font-serif text-[1.6rem] sm:text-[1.9rem] leading-none tracking-wide hidden min-[380px]:inline">invisible<span className="text-rose">women</span></span>
              </Link>
              <nav aria-label="Main" className="ml-auto flex items-center gap-4 lg:gap-7">
                {links.map(([href, label]) => <Link key={href} href={href} className="nav-link hidden lg:inline hover:text-rose">{label}</Link>)}
                {user && <Link href="/my" className="nav-link hidden lg:inline hover:text-rose">{t.my.title}</Link>}
                {user ? (
                  <Link href={profile ? "/profile" : "/onboarding"} className="btn btn-ghost !min-h-[40px] !py-1.5 !text-sm">{complete ? profile?.display_name : t.nav.finishProfile}</Link>
                ) : (
                  <Link href="/login" className="btn btn-primary !min-h-[44px] nav-link !text-[.85rem] !px-5">{t.nav.join}</Link>
                )}
              </nav>
            </div>
            {/* Compact menu for phones and tablets */}
            <nav aria-label="Sections" className="lg:hidden border-t border-line overflow-x-auto">
              <div className="flex gap-5 px-4 py-2.5 whitespace-nowrap">
                {links.map(([href, label]) => <Link key={href} href={href} className="nav-link !text-[.75rem] hover:text-rose">{label}</Link>)}
                {user && <Link href="/my" className="nav-link !text-[.75rem] hover:text-rose">{t.my.title}</Link>}
              </div>
            </nav>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-line mt-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 text-muted leading-relaxed">
              <p className="max-w-4xl">
                {t.footer.disclaimer} <Link href="/about" className="underline hover:text-rose">{t.footer.sources}</Link> · <Link href="/privacy" className="underline hover:text-rose">{t.footer.privacy}</Link>
              </p>
            </div>
          </footer>
        </I18nProvider>
      </body>
    </html>
  );
}
