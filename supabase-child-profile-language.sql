-- Add per-child language preference for Daily Math.
-- Run this once in the Supabase SQL editor.

alter table public.child_profiles
  add column if not exists language text not null default 'ko';

update public.child_profiles
set language = 'ko'
where language is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'child_profiles_language_check'
  ) then
    alter table public.child_profiles
      add constraint child_profiles_language_check
      check (language in ('ko', 'en', 'zh-CN', 'vi', 'th', 'id', 'es'));
  end if;
end $$;
