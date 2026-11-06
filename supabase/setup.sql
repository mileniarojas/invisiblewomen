-- InvisibleWoman database setup: paste this whole file into Supabase → SQL Editor → Run (once).

-- InvisibleWoman: user-owned and community tables.
-- Public research data (drugs, AwareDX side-effect risks, trials) ships as static JSON
-- in /data/build, so this database only holds people's accounts and contributions.

create extension if not exists "pgcrypto";

-- ───────────────────────── Profiles (private) ─────────────────────────
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  birth_year int not null check (birth_year between 1900 and extract(year from now())::int - 13),
  sex_at_birth text not null check (sex_at_birth in ('female','male','intersex','prefer_not')),
  gender_identity text,
  race_ethnicity text[] not null default '{}',
  height_cm numeric check (height_cm between 90 and 250),
  weight_kg numeric check (weight_kg between 25 and 350),
  pregnancy_status text not null default 'no' check (pregnancy_status in ('no','pregnant','trying','postpartum','prefer_not')),
  breastfeeding boolean not null default false,
  menopause_status text not null default 'unknown' check (menopause_status in ('pre','peri','post','unknown')),
  hormonal_contraception boolean not null default false,
  hormone_therapy boolean not null default false,
  conditions text[] not null default '{}',
  allergies text[] not null default '{}',
  kidney_or_liver_disease boolean not null default false,
  consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile_medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  rxcui text,
  name text not null,
  dose text,
  kind text not null default 'prescription' check (kind in ('prescription','otc','supplement','contraceptive','hormone')),
  created_at timestamptz not null default now()
);
create index on public.profile_medications(user_id);

-- A profile is "complete" when it has the basics needed for interaction checks:
-- birth year, sex at birth, pregnancy/breastfeeding status, consent, and at least one
-- medication entry OR an explicit "no medications" (recorded as a row named 'none').
create or replace function public.has_complete_profile(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles p where p.user_id = uid and p.consent_at is not null)
     and exists (select 1 from profile_medications m where m.user_id = uid);
$$;

-- ───────────────────────── Community ─────────────────────────
create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  drug_slug text not null,
  body text not null check (char_length(body) between 10 and 4000),
  side_effects text[] not null default '{}',
  severity int check (severity between 1 and 5),
  duration text,
  -- Non-identifying context the author chose to show, e.g. {"age_band":"30-39","pregnant":false}
  public_context jsonb not null default '{}',
  author_name text not null,
  like_count int not null default 0,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.experiences(drug_slug, created_at desc);

create table public.likes (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  experience_id uuid not null references public.experiences(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, experience_id)
);

create table public.saves (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  drug_slug text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, drug_slug)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  experience_id uuid not null references public.experiences(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (user_id, experience_id)
);

-- Keep like_count in sync.
create or replace function public.bump_like_count() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update experiences set like_count = like_count + 1 where id = new.experience_id;
  elsif tg_op = 'DELETE' then
    update experiences set like_count = greatest(like_count - 1, 0) where id = old.experience_id;
  end if;
  return null;
end $$;
create trigger likes_count after insert or delete on public.likes
  for each row execute function public.bump_like_count();

-- Cache for FDA-label interaction lookups (written by the server only).
create table public.interaction_cache (
  pair_key text primary key,
  result jsonb not null,
  fetched_at timestamptz not null default now()
);

-- ───────────────────────── Row-Level Security ─────────────────────────
alter table public.profiles enable row level security;
alter table public.profile_medications enable row level security;
alter table public.experiences enable row level security;
alter table public.likes enable row level security;
alter table public.saves enable row level security;
alter table public.reports enable row level security;
alter table public.interaction_cache enable row level security; -- no policies: service role only

-- Profiles & medications: owner only, never public.
create policy "own profile read"   on public.profiles for select using (auth.uid() = user_id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = user_id);
create policy "own profile update" on public.profiles for update using (auth.uid() = user_id);
create policy "own profile delete" on public.profiles for delete using (auth.uid() = user_id);

create policy "own meds read"   on public.profile_medications for select using (auth.uid() = user_id);
create policy "own meds insert" on public.profile_medications for insert with check (auth.uid() = user_id);
create policy "own meds update" on public.profile_medications for update using (auth.uid() = user_id);
create policy "own meds delete" on public.profile_medications for delete using (auth.uid() = user_id);

-- Experiences: anyone can read visible posts; only complete profiles can post.
create policy "read visible experiences" on public.experiences for select using (not hidden or auth.uid() = user_id);
create policy "post with complete profile" on public.experiences for insert
  with check (auth.uid() = user_id and public.has_complete_profile(auth.uid()));
create policy "edit own experience" on public.experiences for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "delete own experience" on public.experiences for delete using (auth.uid() = user_id);

-- Likes / saves: complete profile required.
create policy "read own likes" on public.likes for select using (auth.uid() = user_id);
create policy "like with complete profile" on public.likes for insert
  with check (auth.uid() = user_id and public.has_complete_profile(auth.uid()));
create policy "unlike own" on public.likes for delete using (auth.uid() = user_id);

create policy "read own saves" on public.saves for select using (auth.uid() = user_id);
create policy "save with complete profile" on public.saves for insert
  with check (auth.uid() = user_id and public.has_complete_profile(auth.uid()));
create policy "unsave own" on public.saves for delete using (auth.uid() = user_id);

create policy "report with complete profile" on public.reports for insert
  with check (auth.uid() = user_id and public.has_complete_profile(auth.uid()));

-- Auto-hide posts with 3+ reports.
create or replace function public.auto_hide() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update experiences set hidden = true
   where id = new.experience_id and (select count(*) from reports where experience_id = new.experience_id) >= 3;
  return null;
end $$;
create trigger reports_hide after insert on public.reports for each row execute function public.auto_hide();

-- Users may not change like_count / hidden directly.
revoke update (like_count, hidden) on public.experiences from authenticated, anon;

-- More detailed (still optional) health answers used to match women to study exclusion rules.
alter table public.profiles
  add column if not exists birth_control_type text not null default 'none'
    check (birth_control_type in ('none','pill','patch','ring','shot','implant','hormonal_iud','copper_iud','other')),
  add column if not exists smoking text not null default 'never'
    check (smoking in ('never','former','current','prefer_not')),
  add column if not exists surgeries text[] not null default '{}'; -- e.g. hysterectomy, ovaries_removed
-- `conditions` now stores short keys from the questionnaire (heart, diabetes, seizures, mental_health,
-- cancer, kidney, liver, thyroid, autoimmune, pcos, endometriosis, migraine, asthma, osteoporosis, hiv)
-- plus any free-text conditions the person typed.

-- Replace the signed-in user's medication list in a single transaction, so a failed save can
-- never leave the profile without medications (which would lock them out of posting).
create or replace function public.replace_my_medications(meds jsonb)
returns void language plpgsql security invoker set search_path = public as $$
begin
  delete from profile_medications where user_id = auth.uid();
  insert into profile_medications (user_id, rxcui, name, dose, kind)
  select auth.uid(), m->>'rxcui', m->>'name', nullif(m->>'dose', ''), coalesce(m->>'kind', 'prescription')
  from jsonb_array_elements(meds) as m;
end $$;
grant execute on function public.replace_my_medications(jsonb) to authenticated;

-- Where a woman lives, was born, and where her family comes from (ISO 3166 country codes).
-- Used to show whether studies were run in her country/region. Optional.
alter table public.profiles
  add column if not exists residence_country text check (residence_country ~ '^[A-Z]{2}$'),
  add column if not exists birth_country text check (birth_country ~ '^[A-Z]{2}$'),
  add column if not exists family_origins text[] not null default '{}';
