// Original illustration: a pill bottle whose label shows a dashed, "invisible" woman, with capsules.
export function HeroArt() {
  return (
    <svg viewBox="0 0 420 380" className="w-full h-auto" role="img" aria-hidden>
      <ellipse cx="220" cy="350" rx="170" ry="16" className="fill-deep/10" />
      {/* bottle */}
      <rect x="140" y="40" width="140" height="44" rx="10" className="fill-deep" />
      <rect x="150" y="80" width="120" height="16" rx="4" className="fill-deep/80" />
      <rect x="120" y="94" width="180" height="250" rx="34" className="fill-sage-soft" />
      <rect x="120" y="94" width="180" height="250" rx="34" fill="none" className="stroke-deep/20" strokeWidth="2" />
      {/* label */}
      <rect x="142" y="150" width="136" height="150" rx="14" className="fill-card" />
      <g className="stroke-rose" strokeWidth="3" strokeDasharray="6 6" fill="none" strokeLinecap="round">
        <circle cx="210" cy="190" r="18" />
        <path d="M166 290c0-32 19-52 44-52s44 20 44 52z" />
      </g>
      {/* capsules */}
      <g transform="rotate(-28 70 300)">
        <rect x="30" y="285" width="80" height="30" rx="15" className="fill-rose-soft" />
        <path d="M70 285h25a15 15 0 0 1 0 30H70z" className="fill-rose" />
      </g>
      <g transform="rotate(18 350 310)">
        <rect x="310" y="296" width="76" height="28" rx="14" className="fill-amber-soft" />
        <path d="M348 296h24a14 14 0 0 1 0 28h-24z" className="fill-plum" />
      </g>
      <circle cx="345" cy="250" r="13" className="fill-card stroke-line" strokeWidth="2" />
      <path d="M335 250h20" className="stroke-line" strokeWidth="2" />
      {/* sprig */}
      <g className="stroke-sage" strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M350 60c-20 40-24 80-14 120" />
      </g>
      {[[343, 80, -30], [334, 105, 30], [338, 130, -30], [330, 155, 30]].map(([x, y, r]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="12" ry="6" transform={`rotate(${r} ${x} ${y})`} className="fill-sage-soft stroke-sage" strokeWidth="1.5" />
      ))}
    </svg>
  );
}
