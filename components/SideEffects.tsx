"use client";
import { useState } from "react";
import type { Adr } from "@/lib/types";
import { useT } from "@/lib/i18n/client";

export function SideEffects({ risks }: { risks: Adr[] }) {
  const t = useT();
  const [all, setAll] = useState(false);
  const list = risks.slice(0, all ? 8 : 4);
  if (!risks.length) return <p className="text-muted">{t.adr.none}</p>;
  return (
    <div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {list.map((r) => (
          <li key={`${r.event}-${r.level}`} className="rounded-xl bg-rose-soft/60 p-5 flex items-center gap-4">
            <span className="font-serif text-3xl text-rose shrink-0 w-20">{Math.exp(r.logRor).toFixed(1)}×</span>
            <span className="text-deep">{t.events[r.event] ?? r.event}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
        <p className="text-xs text-muted max-w-xl">{t.adr.note}</p>
        {risks.length > 4 && <button className="link-cta text-deep" onClick={() => setAll(!all)}>{all ? t.drug2.showLess : t.drug2.showAll(Math.min(risks.length, 8))}</button>}
      </div>
    </div>
  );
}
