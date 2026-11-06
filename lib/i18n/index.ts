import { en, type Dict } from "./en";
import { es } from "./es";

export type Lang = "en" | "es";
export const LANGS: Lang[] = ["en", "es"];
export const dicts: Record<Lang, Dict> = { en, es };
export const isLang = (x: unknown): x is Lang => x === "en" || x === "es";
export type { Dict };
