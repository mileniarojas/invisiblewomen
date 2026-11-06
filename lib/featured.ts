// The 10 drugs InvisibleWoman focuses on: widely prescribed to women, yet women were
// under-represented in their studies or results were almost never reported by sex.
import type { Lang } from "./i18n";

type Text = { use: string; why: string };
export const FEATURED: { slug: string; en: Text; es: Text }[] = [
  { slug: "pantoprazole",
    en: { use: "Heartburn & acid reflux", why: "One of the most-used stomach medicines, yet only about 1 in 4 people in its studies were women." },
    es: { use: "Acidez y reflujo", why: "Uno de los medicamentos para el estómago más usados, pero solo 1 de cada 4 personas en sus estudios era mujer." } },
  { slug: "methylphenidate",
    en: { use: "ADHD", why: "More and more women are diagnosed with ADHD as adults, but only about a third of the people in its studies were women, and most studies were in children." },
    es: { use: "TDAH", why: "Cada vez más mujeres reciben el diagnóstico de TDAH de adultas, pero solo un tercio de las personas en sus estudios eran mujeres y la mayoría de los estudios fueron en niños." } },
  { slug: "simvastatin",
    en: { use: "High cholesterol", why: "Heart disease is the top cause of death for women, but women were under 40% of the people in its studies." },
    es: { use: "Colesterol alto", why: "Las enfermedades del corazón son la principal causa de muerte en mujeres, pero ellas fueron menos del 40% en sus estudios." } },
  { slug: "spironolactone",
    en: { use: "Blood pressure, acne, PCOS, hair loss", why: "Often prescribed to women for acne, PCOS and hair loss — but mostly tested in heart-failure studies where most people were men." },
    es: { use: "Presión, acné, SOP, caída del pelo", why: "Se receta mucho a mujeres para el acné, el SOP y la caída del pelo, pero se probó sobre todo en estudios de insuficiencia cardiaca con mayoría de hombres." } },
  { slug: "losartan",
    en: { use: "High blood pressure", why: "About half of people with high blood pressure are women, but they were only 39% of the people in its studies." },
    es: { use: "Presión alta", why: "Cerca de la mitad de las personas con presión alta son mujeres, pero fueron solo el 39% en sus estudios." } },
  { slug: "metoprolol",
    en: { use: "Blood pressure & heart rhythm", why: "Women can get higher levels in their blood from the same dose, yet fewer than 2% of its studies looked at women's results separately." },
    es: { use: "Presión y ritmo del corazón", why: "Las mujeres pueden tener niveles más altos en la sangre con la misma dosis, pero menos del 2% de sus estudios revisó los resultados de las mujeres por separado." } },
  { slug: "lisinopril",
    en: { use: "High blood pressure", why: "One of the most prescribed blood-pressure pills, and not one study we found looked at women's results separately." },
    es: { use: "Presión alta", why: "Una de las pastillas para la presión más recetadas, y ningún estudio que encontramos revisó los resultados de las mujeres por separado." } },
  { slug: "amlodipine",
    en: { use: "High blood pressure", why: "Dozens of side effects are reported more often by women, but women were under 45% of the people in its studies." },
    es: { use: "Presión alta", why: "Las mujeres reportan más decenas de efectos secundarios, pero fueron menos del 45% en sus estudios." } },
  { slug: "atorvastatin",
    en: { use: "High cholesterol", why: "The most prescribed cholesterol pill; less than 1% of its studies looked at women's results separately." },
    es: { use: "Colesterol alto", why: "La pastilla para el colesterol más recetada; menos del 1% de sus estudios revisó los resultados de las mujeres por separado." } },
  { slug: "zolpidem",
    en: { use: "Trouble sleeping", why: "In 2013 the FDA cut the dose for women in half after finding next-morning drowsiness — yet none of these studies looked at women's results separately." },
    es: { use: "Problemas para dormir", why: "En 2013 la FDA redujo a la mitad la dosis para mujeres por somnolencia a la mañana siguiente, pero ninguno de estos estudios revisó los resultados de las mujeres por separado." } },
];
export const FEATURED_SLUGS = new Set(FEATURED.map((f) => f.slug));
export const featuredInfo = (slug: string, lang: Lang = "en") => {
  const f = FEATURED.find((x) => x.slug === slug);
  return f ? f[lang] : undefined;
};

/** Spanish drug names (English names are the AwareDX names). */
export const DRUG_NAME_ES: Record<string, string> = {
  pantoprazole: "pantoprazol", methylphenidate: "metilfenidato", simvastatin: "simvastatina", spironolactone: "espironolactona",
  losartan: "losartán", metoprolol: "metoprolol", lisinopril: "lisinopril", amlodipine: "amlodipino", atorvastatin: "atorvastatina", zolpidem: "zolpidem",
};
export const drugName = (slug: string, fallback: string, lang: Lang) => (lang === "es" ? DRUG_NAME_ES[slug] ?? fallback : fallback);

// Side-effect groups that only exist in one sex — "more often in women" is trivially true for these.
export const SEX_SPECIFIC_EVENT = /uterine|pelvic|ovar|cervi|vulv|vagin|menstrua|breast|pregnan|lactation|prostat|testi|penile|scrot|erectile|male reproductive|female reproductive|genitourinary tract disorders|reproductive/i;

export type Category = "heart" | "cholesterol" | "mind" | "stomach" | "skin";
export const CATEGORY: Record<string, Category> = {
  losartan: "heart", metoprolol: "heart", lisinopril: "heart", amlodipine: "heart",
  simvastatin: "cholesterol", atorvastatin: "cholesterol",
  methylphenidate: "mind", zolpidem: "mind",
  pantoprazole: "stomach", spironolactone: "skin",
};
