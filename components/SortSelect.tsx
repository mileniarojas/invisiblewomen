"use client";
import { useRouter } from "next/navigation";

/** "Sort" dropdown for the forum (Top / New), kept in the URL. */
export function SortSelect({ value, label, options }: { value: string; label: string; options: [string, string][] }) {
  const router = useRouter();
  return (
    <label className="block">
      <span className="block text-muted mb-1">{label}</span>
      <select value={value} onChange={(e) => router.push(`/community?sort=${e.target.value}`, { scroll: false })}
        className="input !w-44 !text-lg !py-2.5 !rounded-xl cursor-pointer">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}
