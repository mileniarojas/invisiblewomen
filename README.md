# InvisibleWoman

How each drug was tested on women: share of women in its clinical trials, race/ethnicity, age, BMI,
pregnancy, **which women were excluded**, what data is missing — plus side effects reported more often
in women (AwareDX, Chandak & Tatonetti, *Patterns* 2020) and a community where women with a health
profile share experiences and check interactions with their own medicines.

## Run it

Node.js is installed at `~/.local/node` (official build). Add it to your PATH once:

```bash
echo 'export PATH="$HOME/.local/node/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc
```

```bash
npm install
npm run dev
```

Open http://localhost:3000. Drug and trial pages work right away. Accounts, posts, likes, saves and
interaction checks need Supabase (below).

## Turn on accounts & community (Supabase, free)

1. Create a project at https://supabase.com.
2. In **SQL Editor**, paste and run `supabase/migrations/001_init.sql`.
3. Copy `.env.example` to `.env.local` and fill in the URL, anon key and service-role key from
   **Project Settings → API**. Keep the service-role key secret (server-only).
4. In **Authentication → URL Configuration**, add `http://localhost:3000/auth/callback` (and your
   production URL later) to the redirect URLs.
5. Restart `npm run dev`.

The "must have a profile to comment, like or save" rule is enforced in the database
(`has_complete_profile()` in the RLS policies), not only in the UI. Profiles and medicines are
readable only by their owner.

## Data

| File | What |
| --- | --- |
| `data/sex_biased_adrs.csv` | 20,817 significant sex-biased drug→side-effect pairs (article supplement mmc2) |
| `data/pgx_examples.csv` | Pharmacogenetic examples (mmc4) |
| `data/raw/*.json` | Cached ClinicalTrials.gov results (git-ignored; re-fetchable) |
| `data/build/` | JSON the site reads |

Rebuild:

```bash
npm run data:convert -- ~/Downloads/ScienceDirect_files_06Nov2026_03-18-14.939/1-s2.0-S2666389920301422-mmc2.xlsx ~/Downloads/ScienceDirect_files_06Nov2026_03-18-14.939/1-s2.0-S2666389920301422-mmc4.xlsx data
```

```bash
npm run data:trials -- 150
```

```bash
npm run data:build
```

Raise `150` to load trial breakdowns for more drugs (≈30 s per 10 drugs). Drug-name aliases
(WHO name → US name) live in `lib/aliases.ts`; eligibility rules in `lib/exclusions.ts` (`npm test`).

## Deploy

Push to GitHub and import into Vercel; set the same env vars. `data/build` is bundled with the app.
