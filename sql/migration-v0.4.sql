-- À exécuter UNE FOIS dans Supabase > SQL Editor APRÈS sql/setup.sql.
-- Migration non destructive : les publications existantes et le compte admin sont conservés.
alter table public.entries
  add column if not exists support_type text not null default 'fiche',
  add column if not exists audience text,
  add column if not exists page_count integer,
  add column if not exists is_featured boolean not null default false;

-- Garde-fous adaptés au contenu éditorial (réexécutables).
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'entries_support_type_check') then
    alter table public.entries add constraint entries_support_type_check check (support_type in ('livret', 'fiche', 'kit', 'guide'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'entries_page_count_check') then
    alter table public.entries add constraint entries_page_count_check check (page_count between 1 and 10000);
  end if;
end $$;

create index if not exists entries_featured_listing_idx
  on public.entries (is_featured desc, created_at desc) where published = true and kind = 'ressource';
