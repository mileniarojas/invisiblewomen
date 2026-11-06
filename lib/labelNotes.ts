// Plain-language summaries of each drug's U.S. FDA prescribing label (sections 8.1 Pregnancy,
// 8.2 Lactation, 8.5 Geriatric use, plus women-relevant notes). Written by hand from label text
// fetched Nov 2026 via openFDA (scripts/fetch_group_evidence.ts → data/labels/). Not medical advice.
import type { Lang } from "./i18n";

type Note = { pregnant: string; breastfeeding: string; older: string; women?: string; color?: string };
type Notes = Record<string, Record<Lang, Note>>;

const RAS_PREG_EN = "Can seriously harm or kill an unborn baby, especially in the 2nd and 3rd trimesters. Stop taking it as soon as you know you are pregnant, and talk to your doctor.";
const RAS_PREG_ES = "Puede dañar gravemente o causar la muerte del bebé antes de nacer, sobre todo en el 2.º y 3.er trimestre. Deje de tomarlo apenas sepa que está embarazada y hable con su médico.";
const STATIN_PREG_EN = "Stop taking it when you find out you are pregnant, or ask your doctor. Because of how it works it might harm the baby. It was never tested in pregnant women.";
const STATIN_PREG_ES = "Deje de tomarlo cuando sepa que está embarazada o consulte a su médico. Por cómo funciona, podría dañar al bebé. Nunca se probó en mujeres embarazadas.";

export const LABEL_NOTES: Notes = {
  pantoprazole: {
    en: {
      pregnant: "Studies that followed women who took it while pregnant found no link to birth defects. Animal studies showed bone changes in babies, so the label still warns of possible harm.",
      breastfeeding: "It has been found in the breast milk of one mother. Nothing is known about its effects on the baby.",
      older: "In one group of studies, 4 in 10 people were 65 or older and no differences were seen — but these results weren't split by sex.",
      women: "Long-term use of this type of medicine is linked to weaker bones and fractures. Women past menopause already have a higher fracture risk.",
    },
    es: {
      pregnant: "Los estudios que siguieron a mujeres que lo tomaron en el embarazo no encontraron relación con defectos de nacimiento. En animales hubo cambios en los huesos de las crías, por eso la etiqueta aún advierte de un posible daño.",
      breastfeeding: "Se encontró en la leche de una madre. No se sabe qué efectos tiene en el bebé.",
      older: "En un grupo de estudios, 4 de cada 10 personas tenían 65 años o más y no se vieron diferencias, pero esos resultados no se separaron por sexo.",
      women: "El uso por mucho tiempo de este tipo de medicamento se relaciona con huesos más débiles y fracturas. Las mujeres después de la menopausia ya tienen más riesgo de fracturas.",
    },
  },
  methylphenidate: {
    en: {
      pregnant: "Studies of pregnant women give mixed answers about birth defects and miscarriage. A national registry is collecting more data (1-866-961-2388).",
      breastfeeding: "Small amounts pass into breast milk (under 1% of the mother's dose). No harm to babies has been reported, but this is based on only a few women.",
      older: "Not approved for people over 65 — it was never tested enough in them.",
    },
    es: {
      pregnant: "Los estudios en mujeres embarazadas dan respuestas mixtas sobre defectos de nacimiento y pérdida del embarazo. Un registro nacional está reuniendo más datos (1-866-961-2388).",
      breastfeeding: "Pasa poco a la leche materna (menos del 1% de la dosis de la madre). No se ha reportado daño en bebés, pero se basa en muy pocas mujeres.",
      older: "No está aprobado para mayores de 65 años; nunca se probó lo suficiente en ellas.",
    },
  },
  simvastatin: {
    en: {
      pregnant: STATIN_PREG_EN,
      breastfeeding: "Not recommended while breastfeeding. No one knows if it gets into breast milk.",
      older: "Many study participants were 65 or older, but being 65+ raises the risk of serious muscle damage.",
      women: "Heart disease is the top cause of death for women, yet women were under 40% of the people in these studies.",
    },
    es: {
      pregnant: STATIN_PREG_ES,
      breastfeeding: "No se recomienda al amamantar. No se sabe si pasa a la leche materna.",
      older: "Muchos participantes tenían 65 años o más, pero tener 65 o más aumenta el riesgo de daño muscular grave.",
      women: "Las enfermedades del corazón son la principal causa de muerte en las mujeres, y aun así las mujeres fueron menos del 40% en estos estudios.",
    },
  },
  spironolactone: {
    en: {
      pregnant: "In animal studies it changed how male babies developed. A few reports in pregnant women didn't show birth defects, but there is very little information.",
      breastfeeding: "The medicine itself isn't found in breast milk; a by-product shows up in tiny amounts (based on one woman). Long-term effects on babies are unknown.",
      older: "Your kidneys clear it, and kidneys get weaker with age, so your doctor should check your kidney function.",
      women: "Can cause irregular periods, breast tenderness and bleeding after menopause. It is widely used for acne, PCOS and hair loss in women, but it isn't FDA-approved for those uses.",
    },
    es: {
      pregnant: "En animales cambió el desarrollo de las crías macho. Algunos reportes en embarazadas no mostraron defectos de nacimiento, pero hay muy poca información.",
      breastfeeding: "El medicamento en sí no aparece en la leche; un derivado aparece en cantidades mínimas (según una sola mujer). No se conocen los efectos a largo plazo en el bebé.",
      older: "Los riñones lo eliminan y se debilitan con la edad, así que su médico debe revisar cómo funcionan sus riñones.",
      women: "Puede causar reglas irregulares, dolor en los senos y sangrado después de la menopausia. Se usa mucho para el acné, el SOP y la caída del pelo en mujeres, pero la FDA no lo ha aprobado para esos usos.",
    },
  },
  losartan: {
    en: {
      pregnant: RAS_PREG_EN,
      breastfeeding: "No one knows if it gets into breast milk. The label says not to breastfeed while taking it.",
      older: "Only about 1 in 5 people in its blood-pressure studies were 65 or older.",
      color: "In a large heart study, its benefit for preventing strokes was not seen in Black patients.",
    },
    es: {
      pregnant: RAS_PREG_ES,
      breastfeeding: "No se sabe si pasa a la leche materna. La etiqueta dice no amamantar mientras lo toma.",
      older: "Solo 1 de cada 5 personas en sus estudios de presión arterial tenía 65 años o más.",
      color: "En un estudio grande del corazón, su beneficio para prevenir derrames cerebrales no se vio en pacientes negros.",
    },
  },
  metoprolol: {
    en: {
      pregnant: "Studies that followed pregnant women have not linked it to problems for the baby. Uncontrolled high blood pressure in pregnancy is risky in itself.",
      breastfeeding: "Small amounts pass into breast milk (about 0.5–2% of the mother's dose). No harm to babies has been seen.",
      older: "Blood-pressure studies didn't include enough people 65 or older to know if they respond differently.",
      women: "Women tend to reach higher blood levels of metoprolol than men on the same dose, but the dose is the same for everyone.",
    },
    es: {
      pregnant: "Los estudios que siguieron a mujeres embarazadas no lo han relacionado con problemas para el bebé. La presión alta sin control durante el embarazo ya es un riesgo.",
      breastfeeding: "Pasa poco a la leche materna (cerca del 0.5–2% de la dosis de la madre). No se ha visto daño en bebés.",
      older: "Los estudios de presión arterial no incluyeron suficientes personas de 65 o más para saber si responden distinto.",
      women: "Las mujeres suelen tener niveles más altos de metoprolol en la sangre que los hombres con la misma dosis, pero la dosis es igual para todos.",
    },
  },
  lisinopril: {
    en: {
      pregnant: RAS_PREG_EN,
      breastfeeding: "The label says not to breastfeed while taking it.",
      older: "No dose change is needed for older adults. In one heart-attack study, almost half the people were 65 or older.",
      color: "When used alone, it lowers blood pressure less in Black patients.",
      women: "A dry, nagging cough is a common side effect and is reported more often by women.",
    },
    es: {
      pregnant: RAS_PREG_ES,
      breastfeeding: "La etiqueta dice no amamantar mientras lo toma.",
      older: "No hace falta cambiar la dosis en personas mayores. En un estudio de infarto, casi la mitad tenía 65 años o más.",
      color: "Cuando se usa solo, baja menos la presión en pacientes negros.",
      women: "La tos seca y persistente es un efecto común y las mujeres la reportan más.",
    },
  },
  amlodipine: {
    en: {
      pregnant: "There is too little information to know if it causes birth defects or miscarriage.",
      breastfeeding: "It passes into breast milk (about 4% of the mother's dose). No harm to babies has been seen so far.",
      older: "Studies didn't include enough people 65 or older. Older adults clear it more slowly, so doctors often start with a lower dose.",
      women: "Ankle and leg swelling is a common side effect and happens more often in women.",
    },
    es: {
      pregnant: "Hay muy poca información para saber si causa defectos de nacimiento o pérdida del embarazo.",
      breastfeeding: "Pasa a la leche materna (cerca del 4% de la dosis de la madre). Hasta ahora no se ha visto daño en bebés.",
      older: "Los estudios no incluyeron suficientes personas de 65 o más. Las personas mayores lo eliminan más lento, por eso a menudo se empieza con una dosis menor.",
      women: "La hinchazón de tobillos y piernas es un efecto común y ocurre más en mujeres.",
    },
  },
  atorvastatin: {
    en: {
      pregnant: STATIN_PREG_EN,
      breastfeeding: "Not recommended while breastfeeding.",
      older: "About 40% of study participants were 65 or older, with no overall differences — but age raises the risk of muscle problems.",
    },
    es: {
      pregnant: STATIN_PREG_ES,
      breastfeeding: "No se recomienda al amamantar.",
      older: "Cerca del 40% de los participantes tenía 65 años o más, sin diferencias generales, pero la edad aumenta el riesgo de problemas musculares.",
    },
  },
  zolpidem: {
    en: {
      pregnant: "Taking it late in pregnancy can make newborns very sleepy and slow their breathing. It wasn't studied in pregnant women.",
      breastfeeding: "If you breastfeed, the label says to pump and throw away your milk for 23 hours after a dose.",
      older: "The recommended dose for people 65 and older is 5 mg, because they are more sensitive to it.",
      women: "Women clear zolpidem from the body more slowly than men. In 2013 the FDA cut the recommended starting dose for women in half (to 5 mg) after reports of drowsy driving the next morning.",
    },
    es: {
      pregnant: "Tomarlo al final del embarazo puede hacer que el recién nacido esté muy dormido y respire más lento. No se estudió en mujeres embarazadas.",
      breastfeeding: "Si amamanta, la etiqueta dice sacarse la leche y desecharla durante 23 horas después de cada dosis.",
      older: "La dosis recomendada para personas de 65 o más es de 5 mg, porque son más sensibles.",
      women: "Las mujeres eliminan el zolpidem del cuerpo más lento que los hombres. En 2013 la FDA redujo a la mitad la dosis inicial recomendada para mujeres (a 5 mg) por reportes de somnolencia al manejar a la mañana siguiente.",
    },
  },
};
