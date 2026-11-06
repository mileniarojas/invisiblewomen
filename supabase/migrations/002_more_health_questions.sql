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
