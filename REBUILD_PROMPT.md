Build a website called **InvisibleWoman** in this empty folder. It shows women how 10 everyday medicines were tested: what share of study participants were women, who was in the studies, which groups of women were left out, what was never measured, which side effects women report more, and what each drug's FDA label says about pregnancy, breastfeeding and older women. Women can make a private health profile, check their medicines for interactions, and share their experiences.

Work through this step by step, show me the site in the browser as you go, and check every page on desktop and phone width (no sideways scrolling).

## Setup
- Stack: Next.js 15 (App Router, TypeScript), Tailwind CSS v4, Supabase (Postgres, Auth, Row-Level Security). Install Node.js if it's missing. If Homebrew fails, download the official LTS build from nodejs.org, verify its SHA-256 checksum, and unpack it into `~/.local/node`.
- Keep the public research data as static JSON in `data/build/`, read by the server with `fs`. Supabase only stores accounts and community content. When Supabase keys aren't set, the site still works and the community features show "not connected yet".
- Add a `.env.example` (Supabase URL, anon key, service-role key, optional openFDA key) and a README with setup steps.

## Source data
Source article: Chandak & Tatonetti, "Using Machine Learning to Identify Adverse Drug Effects Posing Increased Risk to Women", *Patterns* 2020 (AwareDX), https://www.sciencedirect.com/science/article/pii/S2666389920301422. Its supplementary files are in `~/Downloads/ScienceDirect_files_06Nov2026_03-18-14.939/`:
- `mmc2.xlsx`: ~20,817 significant sex-biased drug → side-effect pairs (Drug, ATC level, Adverse Event, MedDRA level soc/hlgt, mean log(ROR), 95% CI, p-values). Positive log(ROR) = more often reported in women. Sanity-check this with testosterone derivatives, whose cardiac events should skew male.
- `mmc4.xlsx`: pharmacogenetic examples. `mmc3.xlsx` (163 MB, all pairs): skip.
- Convert the spreadsheets to CSV with a **stdlib-only Python** script (zip + XML parsing; openpyxl isn't installed). Run it with `python3 -I`.
- **Drop side-effect groups for organs only one sex has** (uterine, pelvic, ovarian, breast, menstrual, prostate, genitourinary, etc.). Otherwise "uterine disorders" tops every drug's list.

## The 10 drugs
Only these, in this order, each with a plain-language "used for" line and a one-sentence "why it's here" (English and Spanish):
pantoprazole (heartburn & acid reflux), methylphenidate (ADHD), simvastatin (high cholesterol), spironolactone (blood pressure, acne, PCOS, hair loss), losartan (high blood pressure), metoprolol (blood pressure & heart rhythm), lisinopril (high blood pressure), amlodipine (high blood pressure), atorvastatin (high cholesterol), zolpidem (trouble sleeping; mention the FDA's 2013 halving of the women's dose).
Spanish drug names: pantoprazol, metilfenidato, simvastatina, espironolactona, losartán, metoprolol, lisinopril, amlodipino, atorvastatina, zolpidem.
Tab categories: Heart & blood pressure (losartan, metoprolol, lisinopril, amlodipine), Cholesterol (simvastatin, atorvastatin), Sleep & ADHD (methylphenidate, zolpidem), Stomach (pantoprazole), Skin & hormones (spironolactone).

## Trial data (ClinicalTrials.gov API v2)
- For each drug, fetch up to 200 **completed studies with posted results**, searching by the US drug name (keep an alias map from WHO names to US names). Keep only studies whose interventions actually name the drug. Cache the raw JSON in `data/raw/` (git-ignored). Replace the large outcome module with one flag: were any results split by sex?
- From the baseline table, extract total N; female and male counts (use the "Total" group, otherwise sum the arms); race (bucket the labels; check "White/Caucasian" before "Asian", because "Caucasian" contains "asian"); Hispanic ethnicity (a "Race/Ethnicity" measure with only Hispanic / not Hispanic categories counts as ethnicity); BMI; mean age; % aged 65+ (categories whose lower bound is ≥65); and whether pregnancy or menopause status was recorded.
- **Eligibility parser** (with unit tests): split the criteria into inclusion and exclusion sections and flag: men only, no pregnant women, no breastfeeding, no women who could get pregnant, birth control required, no hormonal birth control, no hormone therapy, postmenopausal only, age cap under 65, BMI limit, no kidney/liver disease. Store the matching sentence, trimmed around the match, so the site can quote it.
- **Group-focused studies**: per drug, search ClinicalTrials.gov (any status) for pregnancy/postpartum, breastfeeding/lactation, menopause, and PCOS/acne/hair loss. Keep a study only if its title or conditions are really about that group. Drop false matches like polycystic *kidney* disease, "born preterm", and withdrawn studies.
- Expected totals across the 10 drugs: ~822 studies, ~499,000 people, 39.8% women, 54% excluded pregnant women, only ~10 studies (1.2%) reported results for women separately, 0 recorded pregnancy status.

## FDA label facts
Fetch each drug's newest **single-ingredient** label from openFDA (avoid combination pills like amlodipine/benazepril). Hand-write short plain-language summaries in English and Spanish of what the label says about pregnancy, breastfeeding and adults 65+, plus women-specific notes. Examples: losartan and lisinopril can seriously harm an unborn baby; zolpidem says to pump and discard milk for 23 hours; methylphenidate isn't approved over 65; amlodipine causes ankle swelling more in women; the losartan label says the stroke benefit wasn't seen in Black patients. Mark these as needing review by a pharmacist.

## Accounts, community, interactions (Supabase)
- Tables: `profiles` (display name, birth year, sex at birth, gender identity, race/ethnicity, height, weight, pregnancy status, breastfeeding, menopause status, hormonal birth control, hormone therapy, conditions, allergies, kidney/liver disease, consent time); `profile_medications` (RxNorm RxCUI, name, dose, type); `experiences` (post text, side effects, severity, duration, opt-in non-identifying context such as age range, like count); `likes`; `saves`; `reports` (auto-hide a post after 3 reports); `interaction_cache`.
- RLS: profiles and medications are owner-only. Experiences are public to read. A `has_complete_profile()` function in the insert policies enforces that **only users with a complete profile (including medications, or an explicit "none") can post, like, save or report**. Users can't change like counts or hidden flags.
- Email/password sign-up, an onboarding health-profile wizard, a profile page with sign out and "delete my account and data", and a saved-medicines page.
- Medication autocomplete via NIH RxNorm `approximateTerm`. NIH's interaction API has been retired, so interaction checks search openFDA label text: contraindications, boxed warning, drug interactions, warnings and precautions, both directions. Use abbreviation-aware sentence splitting ("St. John's Wort"). Also add pregnancy and lactation warnings when the profile says pregnant or breastfeeding, and birth-control interactions when relevant. Always show "not medical advice".

## Language and tone
- English and Spanish (Spanish uses the formal "usted"), with a 🌐 toggle stored in a cookie that defaults to the browser's language. Put every UI string in typed dictionaries (`lib/i18n/en.ts`, `es.ts`). Translate all 31 side-effect terms, exclusion flags and label notes. Study titles and quoted rules stay in English, with a note saying so.
- Use everyday words throughout, never medical jargon. For example: "Hair, nail and sweat-gland problems", not "Skin appendage conditions"; "No pregnant women", not "Pregnancy exclusion".

## Visual design
- Palette: Coffee Brown #8B6A5B, Blush Pink #EFD9D5, Cream Beige #F6EEE8 (background), Eucalyptus Green #BFC9B3, Warm Ivory #E8DCCB, with darker readable shades: deep coffee #4E382F for buttons and bars, dusty rose #9A5363 for women's figures and accents, text #3D2E27. Add a matching dark mode. Put component styles in `@layer components` so Tailwind tint classes can override them.
- Fonts: Tenor Sans (headings) and Jost (body), from next/font.
- Layout inspired by the structure of elixhealing.com. Copy only the pattern, not its branding, images or text: dark announcement bar; centered uppercase nav; huge display headline with one dark uppercase button; pill-shaped category tabs; product-style cards; pink full-width statement band; numbered steps; big stat tiles; dark closing banner.
- Draw an original SVG hero illustration: a pill bottle whose label shows a dashed-outline woman, with capsules and a sprig.

## Home page, in this exact order
1. Headline "Your medicine was tested. **Were you?**" (underlined in rose), a "Find my medicine" button, a list of categories, a "See what we found" link, and the illustration.
2. **How it works**: a 25-person grid with 2 in 5 colored, and 3 numbered steps (Pick your medicine / See who was tested / Make it about you).
3. **Pink statement band**: "Women report side effects more often than men. Yet out of 822 studies of these 10 medicines, only 10 looked at how women did on their own." then "We read them all, so you don't have to."
4. **What the studies show**: three big number tiles (39.8% women / 1.2% looked at women separately / 0 recorded pregnancy).
5. **The women left out**: four cards (pregnant women, breastfeeding moms, women 65+, women of color) with ✕ bullet facts.
6. **The 10 medicines**, with category tabs. Each card: **drug name biggest, then what it's used for** in normal dark text, then a *small* pink strip "26.8% women in its studies" with a thin progress line, then a full-width dark "See the gaps" button. Four columns on desktop, one per row on phones. Size the names so "Methylphenidate" fits on one line at every width.
7. Data sources strip (U.S. FDA, ClinicalTrials.gov, NIH RxNorm, Patterns · Cell Press, openFDA).
8. Dark "Your experience counts. / Join InvisibleWoman" banner.
All numbers on the page are computed from the data, except the announcement bar ("Women were less than half the people tested for 9 of these 10 everyday medicines.").

## Drug page: answer first, details on demand
1. Hero: use (eyebrow), big drug name, the "why it's here" sentence, three pink stat tiles (% women, % that banned pregnant women, % that looked at women separately), a "Was someone like me tested?" button, a "Check my medicines" link, and ☆ Save.
2. **"Was someone like me tested?"** A row of pill tabs, one per group: Pregnant, Breastfeeding, Could get pregnant, Birth control & hormones, 65 and older, Women of color, Higher weight, Menopause, plus "PCOS, acne & hair" when there are ≥2 focused studies. One panel at a time, with a verdict chip (Not studied / Barely / Partly / Included / Unknown); "Were they studied?" with real percentages and focused-study counts; "What do we know?" with the FDA label summary in a green box (or "Nothing specific" when there's no label note); and an expandable list of focused studies. Above the tabs, state once that no study reported results separately for any group.
3. Pink "Good to know" band with the women-specific label note.
4. "What women report more": top 4 side effects as pink tiles ("2.6× Physical symptoms with no clear cause"), with "Show all 8" and a short note that FDA reports are a warning sign, not proof.
5. "Make it about you": the interaction checker and the experiences feed (post form with opt-in context, likes, report, delete own).
6. **"All the details"** in expandable sections: Who was in the studies (women/men bar with a parity line, race bars, Hispanic %, 65+ %, men-only and women-only counts), Rules that kept women out (with "See the exact rule" quotes), What nobody checked (percentage tiles), and All N studies (a table linking to per-study pages).

Also build a per-study page, a bilingual "How we did this" methods page with limitations, a bilingual privacy page, and a 404 page.

When done, run the tests and `next build` (stop the dev server first, then clear `.next`), and show me the site.
