// AwareDX uses WHO/ATC (INN) names; US labels and trials often use USAN names.
export const US_NAMES: Record<string, string[]> = {
  "acetylsalicylic acid": ["aspirin"],
  paracetamol: ["acetaminophen"],
  salbutamol: ["albuterol"],
  ciclosporin: ["cyclosporine"],
  adrenaline: ["epinephrine"],
  noradrenaline: ["norepinephrine"],
  glibenclamide: ["glyburide"],
  colecalciferol: ["cholecalciferol", "vitamin d3"],
  ergocalciferol: ["vitamin d2"],
  "levothyroxine sodium": ["levothyroxine"],
  lidocaine: ["lignocaine"],
  pethidine: ["meperidine"],
  rifampicin: ["rifampin"],
  frusemide: ["furosemide"],
  "valproic acid": ["valproate", "divalproex"],
  "mycophenolic acid": ["mycophenolate"],
  "folic acid": ["folate"],
  "retinol": ["vitamin a"],
  "ascorbic acid": ["vitamin c"],
  "tocopherol": ["vitamin e"],
  "cyanocobalamin": ["vitamin b12"],
  "estradiol": ["oestradiol"],
  "levonorgestrel and ethinylestradiol": ["levonorgestrel"],
  amfetamine: ["amphetamine"],
  dexamfetamine: ["dextroamphetamine"],
  lisdexamfetamine: ["lisdexamfetamine"],
  "paracetamol, combinations excl. psycholeptics": ["acetaminophen"],
  "ascorbic acid (vit c)": ["ascorbic acid", "vitamin c"],
  dimeticone: ["dimethicone", "simethicone"],
  isopropanol: ["isopropyl alcohol"],
  "glyceryl trinitrate": ["nitroglycerin"],
  "isosorbide mononitrate": ["isosorbide mononitrate"],
  "methylphenidate": ["methylphenidate"],
  "zoledronic acid": ["zoledronic acid"],
};

/** Names to try when matching this drug in trials or FDA labels (first = best search term). */
export function drugNames(drug: string): string[] {
  const d = drug.toLowerCase();
  const names = [...(US_NAMES[d] ?? []), d];
  if (/ic acid$/.test(d)) names.push(d.replace(/ic acid$/, "ate"));
  return [...new Set(names)];
}
