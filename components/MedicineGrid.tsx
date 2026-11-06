"use client";
import { useState } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/client";

export type GridItem = { slug: string; name: string; use: string; pct: number; cat: string };

export function MedicineGrid({ items }: { items: GridItem[] }) {
  const t = useT().home;
  const [cat, setCat] = useState("all");
  const cats = ["all", "heart", "cholesterol", "mind", "stomach", "skin"];
  const shown = items.filter((i) => cat === "all" || i.cat === cat);
  return (
    <div>
      <div role="tablist" className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:flex-wrap sm:justify-center sm:overflow-visible">
        {cats.map((c) => (
          <button key={c} role="tab" aria-selected={cat === c} className="pill-tab" onClick={() => setCat(c)}>{t.tabs[c]}</button>
        ))}
      </div>
      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {shown.map((d) => (
          <li key={d.slug} className="flex">
            <Link href={`/drugs/${d.slug}`} className="group flex flex-col flex-1 rounded-2xl bg-card border border-line p-5 transition hover:border-rose hover:shadow-sm">
              {/* Most important: the medicine and what it's for */}
              <h3 className="font-serif text-[1.75rem] sm:text-[1.7rem] lg:text-[1.35rem] xl:text-[1.65rem] capitalize leading-tight text-deep">{d.name}</h3>
              <p className="mt-1 text-base leading-snug sm:min-h-[2.75rem]">{d.use}</p>
              {/* Supporting: share of women in its studies */}
              <div className="mt-4 rounded-lg bg-rose-soft/60 px-4 py-3">
                <div className="flex items-baseline gap-2">
                  <span className={`font-serif text-2xl ${d.pct < 50 ? "text-rose" : "text-deep"}`}>{d.pct}%</span>
                  <span className="text-xs text-muted">{t.tileLabel}</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-card overflow-hidden" aria-hidden>
                  <div className={`h-full rounded-full ${d.pct < 50 ? "bg-rose" : "bg-deep"}`} style={{ width: `${d.pct}%` }} />
                </div>
              </div>
              <div className="mt-auto pt-4"><span className="btn btn-primary w-full !text-xs">{t.seeGaps}</span></div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
