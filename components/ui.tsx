import type { ReactNode } from "react";

export function Section({ id, eyebrow, title, intro, children }: { id?: string; eyebrow?: string; title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      {eyebrow && <p className="text-xs font-bold uppercase tracking-widest text-rose mb-1">{eyebrow}</p>}
      <h2 className="font-serif text-3xl mb-2">{title}</h2>
      {intro ? <p className="text-muted max-w-3xl mb-6">{intro}</p> : <div className="mb-5" />}
      {children}
    </section>
  );
}

export function Stat({ value, label, tone = "ink" }: { value: ReactNode; label: ReactNode; tone?: "ink" | "rose" | "amber" | "sage" }) {
  const color = { ink: "text-ink", rose: "text-rose", amber: "text-amber", sage: "text-sage" }[tone];
  return (
    <div className="card p-5">
      <div className={`font-serif text-3xl sm:text-4xl font-semibold ${color}`}>{value}</div>
      <div className="text-sm text-muted mt-1">{label}</div>
    </div>
  );
}

export function Gap({ children }: { children?: ReactNode }) {
  return (
    <span className="chip bg-ghost/40 text-muted border border-dashed border-ghost" >
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden><circle cx="5" cy="5" r="4" fill="none" stroke="currentColor" strokeDasharray="2 1.5" /></svg>
      {children}
    </span>
  );
}

export const fmt = (n: number) => n.toLocaleString("en-US");
