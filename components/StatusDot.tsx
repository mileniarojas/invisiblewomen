export function StatusDot({ s }: { s: "excluded" | "limited" | "included" | "unknown" }) {
  const cls = { excluded: "bg-rose text-paper", limited: "bg-amber-soft text-deep border border-deep/30", included: "bg-sage-soft text-sage", unknown: "bg-ghost/60 text-deep" }[s];
  const sym = { excluded: "✕", limited: "!", included: "✓", unknown: "?" }[s];
  return <span className={`inline-flex w-5 h-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${cls}`} aria-hidden>{sym}</span>;
}
