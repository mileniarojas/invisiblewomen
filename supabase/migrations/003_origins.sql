-- Where a woman lives, was born, and where her family comes from (ISO 3166 country codes).
-- Used to show whether studies were run in her country/region. Optional.
alter table public.profiles
  add column if not exists residence_country text check (residence_country ~ '^[A-Z]{2}$'),
  add column if not exists birth_country text check (birth_country ~ '^[A-Z]{2}$'),
  add column if not exists family_origins text[] not null default '{}';
