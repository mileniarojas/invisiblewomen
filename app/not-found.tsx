import Link from "next/link";
import { getT } from "@/lib/i18n/server";
export default async function NotFound() {
  const { t } = await getT();
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-serif text-4xl mb-3">{t.notFound.title}</h1>
      <p className="text-muted mb-6">{t.notFound.body}</p>
      <Link href="/drugs" className="btn btn-primary">{t.notFound.back}</Link>
    </div>
  );
}
