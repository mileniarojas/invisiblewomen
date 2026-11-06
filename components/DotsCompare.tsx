/** 100-dot comparison, e.g. 15 of 100 women vs 3 of 100 men. Filled dots are berry, the rest are outlines. */
export function DotsCompare({ a, b, labelA, labelB, of100, caption, sourceHref, sourceLabel }: {
  a: number; b: number; labelA: string; labelB: string; of100: string; caption: string; sourceHref: string; sourceLabel: string;
}) {
  const grid = (filled: number) => (
    <div className="grid grid-cols-10 gap-[6px] sm:gap-2 mt-4" aria-hidden>
      {Array.from({ length: 100 }).map((_, i) => (
        <span key={i} className={`aspect-square rounded-full ${i < filled ? "bg-rose" : "border-[1.5px] border-edge"}`} />
      ))}
    </div>
  );
  return (
    <figure className="card p-6 sm:p-8" aria-label={`${labelA}: ${a} ${of100}. ${labelB}: ${b} ${of100}.`}>
      <div className="grid grid-cols-2 gap-6 sm:gap-10">
        {[[labelA, a], [labelB, b]].map(([l, n]) => (
          <div key={String(l)}>
            <p className="text-lg text-muted">{l}</p>
            <p><span className="font-serif text-5xl text-ink">{n}</span> <span className="text-xl text-muted">{of100}</span></p>
            {grid(Number(n))}
          </div>
        ))}
      </div>
      <figcaption className="mt-6 text-[1.05rem] leading-relaxed text-muted">
        {caption} <a href={sourceHref} target="_blank" rel="noreferrer" className="text-sm font-bold text-plum underline align-super">{sourceLabel}</a>
      </figcaption>
    </figure>
  );
}
