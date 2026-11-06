// Countries (ISO 3166-1 alpha-2), world regions, and matching ClinicalTrials.gov location names to codes.

export type Region =
  | "north_america" | "latin_america" | "europe" | "middle_east_north_africa" | "sub_saharan_africa"
  | "south_asia" | "east_asia" | "southeast_asia" | "central_asia" | "oceania";

const R: Record<Region, string> = {
  north_america: "US CA BM GL PM",
  latin_america: "MX GT BZ SV HN NI CR PA CU DO HT JM PR TT BS BB AG DM GD KN LC VC AW CW SX BQ VG VI KY TC MS AI GP MQ BL MF CO VE EC PE BO CL AR UY PY BR GY SR GF FK",
  europe: "GB IE IS NO SE FI DK EE LV LT PL DE NL BE LU FR MC AD ES PT IT SM VA MT CH LI AT CZ SK HU SI HR BA RS ME MK AL GR BG RO MD UA BY RU CY XK FO GI IM JE GG AX",
  middle_east_north_africa: "MA DZ TN LY EG SD IL PS LB SY JO IQ SA YE OM AE QA BH KW IR TR EH",
  sub_saharan_africa: "MR ML NE TD SN GM GW GN SL LR CI BF GH TG BJ NG CM CF SS ER ET DJ SO KE UG RW BI TZ CD CG GA GQ ST AO ZM MW MZ ZW BW NA ZA LS SZ MG MU SC KM CV RE YT SH",
  south_asia: "IN PK BD LK NP BT MV AF",
  east_asia: "CN HK MO TW JP KR KP MN",
  southeast_asia: "TH VN LA KH MM MY SG ID PH BN TL",
  central_asia: "KZ UZ TM KG TJ AZ GE AM",
  oceania: "AU NZ PG FJ SB VU NC PF WS TO KI TV NR FM MH PW GU MP AS CK NU TK WF",
};

export const REGION_OF: Record<string, Region> = Object.fromEntries(
  (Object.entries(R) as [Region, string][]).flatMap(([region, codes]) => codes.split(" ").map((c) => [c, region])),
);
export const COUNTRY_CODES = Object.keys(REGION_OF);

export const REGION_LABEL: Record<Region, string> = {
  north_america: "the US and Canada", latin_america: "Latin America and the Caribbean", europe: "Europe",
  middle_east_north_africa: "the Middle East and North Africa", sub_saharan_africa: "Sub-Saharan Africa",
  south_asia: "South Asia", east_asia: "East Asia", southeast_asia: "Southeast Asia", central_asia: "Central Asia and the Caucasus", oceania: "Australia and the Pacific",
};

const display = new Intl.DisplayNames(["en"], { type: "region" });
export const countryName = (code: string) => {
  try { return display.of(code) ?? code; } catch { return code; }
};

/** All countries, sorted by English name, for pickers. */
export const COUNTRY_OPTIONS: [string, string][] = COUNTRY_CODES.map((c) => [c, countryName(c)] as [string, string]).sort((a, b) => a[1].localeCompare(b[1]));

// ClinicalTrials.gov uses older UN-style names for some countries.
const ALIASES: Record<string, string> = {
  "korea, republic of": "KR", "south korea": "KR", "korea, democratic people's republic of": "KP",
  "russian federation": "RU", "iran, islamic republic of": "IR", "viet nam": "VN", "taiwan": "TW",
  "czech republic": "CZ", "czechia": "CZ", "turkey": "TR", "türkiye": "TR", "turkey (türkiye)": "TR", "hong kong": "HK", "macao": "MO",
  "macedonia, the former yugoslav republic of": "MK", "north macedonia": "MK", "moldova, republic of": "MD",
  "syrian arab republic": "SY", "tanzania": "TZ", "tanzania, united republic of": "TZ", "bolivia": "BO",
  "venezuela": "VE", "lao people's democratic republic": "LA", "côte d'ivoire": "CI", "cote d'ivoire": "CI",
  "congo, the democratic republic of the": "CD", "congo": "CG", "palestinian territory, occupied": "PS",
  "libyan arab jamahiriya": "LY", "united states": "US", "united kingdom": "GB", "puerto rico": "PR",
  "brunei darussalam": "BN", "micronesia, federated states of": "FM", "holy see (vatican city state)": "VA",
  "réunion": "RE", "reunion": "RE", "former serbia and montenegro": "RS", "serbia and montenegro": "RS",
};
let nameToCode: Map<string, string> | null = null;
export function codeForCountryName(name: string): string | null {
  if (!nameToCode) {
    nameToCode = new Map(COUNTRY_CODES.map((c) => [countryName(c).toLowerCase(), c]));
    for (const [k, v] of Object.entries(ALIASES)) nameToCode.set(k, v);
  }
  return nameToCode.get(name.trim().toLowerCase()) ?? null;
}

// Country names that read naturally with "the" ("You live in the United States").
const WITH_THE = new Set(["US", "GB", "NL", "PH", "AE", "DO", "BS", "GM", "CF", "CD", "CG", "KY", "VG", "VI", "MV", "MH", "SB", "KM", "SC", "CZ", "VA"]);
export const countryInSentence = (code: string) => (WITH_THE.has(code) ? `the ${countryName(code)}` : countryName(code));
