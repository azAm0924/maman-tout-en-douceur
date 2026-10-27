-- Après sql/setup.sql ET sql/migration-v0.4.sql. Exécuter UNE SEULE FOIS dans Supabase SQL Editor.
-- Les créations et comptes admin existants sont conservés.

alter table public.entries
  add column if not exists pdf_for_sale boolean not null default false,
  add column if not exists pdf_price_cents integer,
  add column if not exists print_for_sale boolean not null default false,
  add column if not exists print_price_cents integer,
  add column if not exists paid_pdf_path text,
  add column if not exists paid_pdf_name text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='entries_pdf_price_valid') then
    alter table public.entries add constraint entries_pdf_price_valid check (pdf_price_cents is null or pdf_price_cents between 50 and 10000000);
  end if;
  if not exists (select 1 from pg_constraint where conname='entries_print_price_valid') then
    alter table public.entries add constraint entries_print_price_valid check (print_price_cents is null or print_price_cents between 50 and 10000000);
  end if;
end $$;

-- Rien ne doit rendre payants des fichiers déjà déposés publiquement.
-- Si un PDF était dans publications/files/, il demeure PUBLIC même après cette migration.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('paid-downloads','paid-downloads',false,52428800,array['application/pdf']::text[])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "Admin paid files" on storage.objects;
create policy "Admin paid files" on storage.objects for all to authenticated
using (bucket_id='paid-downloads' and (select public.is_admin()))
with check (bucket_id='paid-downloads' and (select public.is_admin()));

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending' check (status in ('pending','paid','failed','expired','refunded')),
  email text,
  customer_name text,
  currency text not null default 'eur' check (currency='eur'),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_cents integer not null default 0 check (shipping_cents >= 0),
  total_cents integer check (total_cents >= 0),
  has_physical boolean not null default false,
  digital_consent boolean not null default false,
  consented_at timestamptz,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  access_token_hash text not null,
  shipping_address jsonb,
  fulfillment_status text not null default 'pending' check (fulfillment_status in ('pending','preparing','shipped','delivered')),
  tracking_url text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  entry_id uuid references public.entries(id) on delete set null,
  title text not null,
  variant text not null check (variant in ('pdf','print')),
  quantity integer not null check (quantity between 1 and 10),
  unit_price_cents integer not null check (unit_price_cents >= 50),
  paid_pdf_path text
);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_orders_created on public.orders(created_at desc);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
revoke all on public.orders from anon, authenticated;
revoke all on public.order_items from anon, authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_items to authenticated;

-- Les visiteurs n'ont AUCUN accès aux commandes via l'API Supabase publique.
-- Le serveur Next.js utilise la clé serveur, et vérifie un jeton aléatoire haché.
drop policy if exists "Admin view orders" on public.orders;
create policy "Admin view orders" on public.orders for select to authenticated using ((select public.is_admin()));
drop policy if exists "Admin update orders" on public.orders;
create policy "Admin update orders" on public.orders for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "Admin view order items" on public.order_items;
create policy "Admin view order items" on public.order_items for select to authenticated using ((select public.is_admin()));

-- Ne pas permettre à l'admin navigateur de modifier le prix ou le statut de paiement via API publique.
-- Seul le statut de préparation / suivi peut être modifié avec les permissions ci-dessous.
revoke update on public.orders from authenticated;
grant update(fulfillment_status, tracking_url) on public.orders to authenticated;
