-- Maman tout en douceur — à exécuter dans Supabase > SQL Editor.
-- 1. Créer d'abord le projet Supabase.
-- 2. Exécuter ce script (réexécutable).
-- 3. Créer ensuite le compte de la propriétaire via Authentication > Users.
-- 4. Exécuter sql/add-admin.sql après avoir remplacé l'adresse e-mail.

create extension if not exists pgcrypto;

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- SECURITY DEFINER : consultation des administrateurs sans rendre la table lisible.
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists(select 1 from public.admins where user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('article', 'ressource')),
  title text not null check (char_length(title) between 1 and 170),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  excerpt text not null default '',
  body text not null default '',
  category text not null default 'Grossesse',
  cover_path text,
  attachment_path text,
  attachment_name text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists trg_entries_updated on public.entries;
create trigger trg_entries_updated before update on public.entries
  for each row execute function public.touch_updated_at();

create index if not exists entries_public_listing_idx on public.entries (kind, created_at desc) where published = true;

alter table public.admins enable row level security;
alter table public.entries enable row level security;

-- Aucun accès direct à la table admins pour les visiteurs.
revoke all on public.admins from anon, authenticated;

drop policy if exists "Published or admin read" on public.entries;
create policy "Published or admin read" on public.entries
  for select to anon, authenticated
  using (published = true or (select public.is_admin()));

drop policy if exists "Admin insert" on public.entries;
create policy "Admin insert" on public.entries
  for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Admin update" on public.entries;
create policy "Admin update" on public.entries
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admin delete" on public.entries;
create policy "Admin delete" on public.entries
  for delete to authenticated
  using ((select public.is_admin()));

grant select on public.entries to anon;
grant select, insert, update, delete on public.entries to authenticated;

-- Bucket public : fichiers volontairement destinés au téléchargement public.
-- Ne jamais y déposer de documents médicaux ou de données personnelles.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'publications', 'publications', true, 15728640,
  array[
    'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admin object operations" on storage.objects;
create policy "Admin object operations" on storage.objects
  for all to authenticated
  using (bucket_id = 'publications' and (select public.is_admin()))
  with check (bucket_id = 'publications' and (select public.is_admin()));

-- Aucun service-role key dans l'application ; seules les clés publiques sont nécessaires.
