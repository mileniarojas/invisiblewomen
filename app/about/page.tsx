import { getT } from "@/lib/i18n/server";

const CONTENT = {
  en: {
    title: "How we did this",
    intro: "Until 1993, U.S. rules kept most women who could get pregnant out of early medicine studies. Today women are still often a minority in studies, and results are rarely shown separately for women — even though women report side effects more often. InvisibleWoman shows those gaps, one medicine at a time.",
    sections: [
      ["Why these 10 medicines", "Each one is widely prescribed to women. In every one of them, women were under half of the study participants, or fewer than 3 in 100 studies looked at women's results separately."],
      ["Who was in the studies", "We collected finished studies that posted their results on ClinicalTrials.gov (the U.S. government's study registry) and counted who took part: women and men, race, Hispanic or Latina background, age and weight."],
      ["Which women were left out", "Every study has rules about who can join. We read those rules and flagged ones that turned women away — for example, being pregnant, breastfeeding, on the pill, over a certain age or above a weight limit. You can always see the exact rule."],
      ["Group by group", "For pregnant women, breastfeeding moms, older women and other groups, we also searched for studies that focused on them, and we summarized what each medicine's official FDA label says, in plain words."],
      ["Side effects reported more by women", "These come from a 2020 study by Chandak and Tatonetti (Patterns journal), which used millions of reports sent to the FDA and compared women and men taking the same medicine. We left out problems with body parts only one sex has (like the uterus or prostate)."],
      ["Checking your medicines", "We look up your medicines in the NIH RxNorm list and then search each medicine's FDA label for warnings about the others."],
    ],
    limitsTitle: "What this can't tell you",
    limits: [
      "Reports to the FDA are voluntary. \"Reported more often\" is a warning sign, not proof the medicine causes more harm in women.",
      "Only studies that posted results online are included. Many older studies are missing.",
      "A study can appear here if the medicine was only used for comparison.",
      "Our rule-reading is automatic and can miss unusual wording.",
      "No warning found doesn't mean a combination is safe.",
      "Nothing here is medical advice.",
    ],
    cite: "Chandak P, Tatonetti NP. Using Machine Learning to Identify Adverse Drug Effects Posing Increased Risk to Women. Patterns, 2020.",
  },
  es: {
    title: "Cómo lo hicimos",
    intro: "Hasta 1993, las reglas de EE. UU. dejaban fuera de los primeros estudios de medicamentos a la mayoría de las mujeres que podían quedar embarazadas. Hoy las mujeres siguen siendo minoría en muchos estudios y casi nunca se muestran sus resultados por separado, aunque ellas reportan más efectos secundarios. InvisibleWoman muestra esos vacíos, medicamento por medicamento.",
    sections: [
      ["Por qué estos 10 medicamentos", "Todos se recetan mucho a mujeres. En cada uno, las mujeres fueron menos de la mitad de los participantes, o menos de 3 de cada 100 estudios revisaron los resultados de las mujeres por separado."],
      ["Quién participó", "Reunimos estudios terminados que publicaron sus resultados en ClinicalTrials.gov (el registro de estudios del gobierno de EE. UU.) y contamos quién participó: mujeres y hombres, raza, origen hispano o latino, edad y peso."],
      ["Qué mujeres quedaron fuera", "Cada estudio tiene reglas sobre quién puede participar. Leímos esas reglas y marcamos las que rechazaban a mujeres; por ejemplo, por estar embarazada, amamantar, tomar la pastilla, pasar cierta edad o cierto peso. Siempre puede ver la regla exacta (en inglés)."],
      ["Grupo por grupo", "Para mujeres embarazadas, madres que amamantan, mujeres mayores y otros grupos, también buscamos estudios centrados en ellas y resumimos en palabras sencillas lo que dice la etiqueta oficial de la FDA de cada medicamento."],
      ["Efectos secundarios reportados más por mujeres", "Vienen de un estudio de 2020 de Chandak y Tatonetti (revista Patterns), que usó millones de reportes enviados a la FDA y comparó a mujeres y hombres que tomaban el mismo medicamento. Dejamos fuera problemas de partes del cuerpo que solo tiene un sexo (como el útero o la próstata)."],
      ["Revisar sus medicamentos", "Buscamos sus medicamentos en la lista RxNorm de los NIH y luego revisamos la etiqueta de la FDA de cada uno para encontrar advertencias sobre los demás."],
    ],
    limitsTitle: "Lo que esto no puede decirle",
    limits: [
      "Los reportes a la FDA son voluntarios. \"Reportado más\" es una señal de alerta, no prueba de que el medicamento haga más daño a las mujeres.",
      "Solo se incluyen estudios que publicaron resultados en línea. Faltan muchos estudios antiguos.",
      "Un estudio puede aparecer aquí aunque el medicamento solo se usara para comparar.",
      "Nuestra lectura de reglas es automática y puede fallar con frases poco comunes.",
      "Que no aparezca una advertencia no significa que una combinación sea segura.",
      "Nada de esto es consejo médico.",
    ],
    cite: "Chandak P, Tatonetti NP. Using Machine Learning to Identify Adverse Drug Effects Posing Increased Risk to Women. Patterns, 2020.",
  },
};

export async function generateMetadata() { return { title: CONTENT[(await getT()).lang].title }; }

export default async function About() {
  const c = CONTENT[(await getT()).lang];
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 space-y-10 leading-relaxed">
      <header>
        <h1 className="font-serif text-4xl mb-3">{c.title}</h1>
        <p className="text-lg text-muted">{c.intro}</p>
      </header>
      {c.sections.map(([h, b]) => (
        <section key={h}><h2 className="font-serif text-2xl mb-2">{h}</h2><p>{b}</p></section>
      ))}
      <section className="card p-6">
        <h2 className="font-serif text-2xl mb-2">{c.limitsTitle}</h2>
        <ul className="list-disc pl-6 space-y-1">{c.limits.map((l) => <li key={l}>{l}</li>)}</ul>
      </section>
      <p className="text-sm text-muted"><a className="underline" href="https://doi.org/10.1016/j.patter.2020.100108" target="_blank" rel="noreferrer">{c.cite}</a></p>
    </article>
  );
}
