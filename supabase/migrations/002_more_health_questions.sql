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
