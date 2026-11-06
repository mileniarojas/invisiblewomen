import { getT } from "@/lib/i18n/server";

const CONTENT = {
  en: { title: "Privacy", paras: [
    "Your health profile (birth year, sex, race, height and weight, pregnancy, breastfeeding, menopause, birth control, health conditions, allergies and medicines) is private. Only you can see or change it — not other users and not the public site.",
    "We use it for two things: to check your medicines against FDA labels, and — only if you tick the boxes when you post — to show a short, non-identifying note next to your post, like an age range (\"30–39\") or \"on hormonal birth control\".",
    "Your posts show the name you choose, never your email or exact age.",
    "When you check interactions, medicine names (not who you are) are sent to the U.S. FDA's openFDA service. When you search for a medicine, what you type is sent to the NIH RxNorm service.",
    "You can delete your account from your profile page. This permanently removes your profile, medicines, posts, likes and saves.",
    "InvisibleWoman is not a medical provider. Don't post anything you wouldn't want to be public.",
  ] },
  es: { title: "Privacidad", paras: [
    "Su perfil de salud (año de nacimiento, sexo, raza, estatura y peso, embarazo, lactancia, menopausia, anticonceptivos, problemas de salud, alergias y medicamentos) es privado. Solo usted puede verlo o cambiarlo; ni otras usuarias ni el sitio público.",
    "Lo usamos para dos cosas: revisar sus medicamentos con las etiquetas de la FDA y, solo si marca las casillas al publicar, mostrar una nota corta que no la identifica junto a su publicación, como un rango de edad (\"30–39\") o \"con anticonceptivo hormonal\".",
    "Sus publicaciones muestran el nombre que usted elija, nunca su correo ni su edad exacta.",
    "Al revisar interacciones, los nombres de los medicamentos (no quién es usted) se envían al servicio openFDA de la FDA. Al buscar un medicamento, lo que escribe se envía al servicio RxNorm de los NIH.",
    "Puede borrar su cuenta desde su perfil. Esto elimina para siempre su perfil, medicamentos, publicaciones, me gusta y guardados.",
    "InvisibleWoman no es un proveedor médico. No publique nada que no quiera que sea público.",
  ] },
};

export async function generateMetadata() { return { title: CONTENT[(await getT()).lang].title }; }

export default async function Privacy() {
  const c = CONTENT[(await getT()).lang];
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 space-y-6 leading-relaxed">
      <h1 className="font-serif text-4xl">{c.title}</h1>
      {c.paras.map((p) => <p key={p}>{p}</p>)}
    </article>
  );
}
