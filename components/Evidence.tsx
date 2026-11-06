import type { Evidence as Ev } from "@/lib/personal";

/** Expandable proof for a finding: the exact eligibility rule and the study it came from. */
export function Evidence({ e, label }: { e?: Ev; label: string }) {
  if (!e) return null;
  const href = e.live ? `https://clinicaltrials.gov/study/${e.nct}` : `/trials/${e.nct}`;
  return (
    <details className="mt-1 text-sm">
      <summary className="cursor-pointer text-muted hover:text-ink w-fit">{label}</summary>
      <blockquote lang="en" className="mt-1.5 italic border-l-2 border-rose-soft pl-3 text-muted">
        “{e.quote}” <a href={href} className="not-italic underline" target={e.live ? "_blank" : undefined} rel="noreferrer">{e.nct}</a>
      </blockquote>
    </details>
  );
}
