-- v0.6 après setup.sql, migration-v0.4.sql et migration-v0.5.sql.
-- Sauvegarde Supabase recommandée. Préserve les produits, commandes et comptes existants.

alter table public.entries add column if not exists is_hidden boolean not null default false;
alter table public.entries add column if not exists print_stock integer;
do $$ begin
 if not exists(select 1 from pg_constraint where conname='entries_print_stock_nonnegative') then
  alter table public.entries add constraint entries_print_stock_nonnegative check (print_stock is null or print_stock >= 0);
 end if;
end $$;
-- NULL = stock illimité / non suivi, 0 = rupture.

drop policy if exists "Published or admin read" on public.entries;
create policy "Published or admin read" on public.entries for select to anon,authenticated
  using ((published = true and is_hidden = false) or (select public.is_admin()));

create table if not exists public.customer_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 email text, display_name text,
 stripe_customer_id text unique,
 created_at timestamptz not null default now()
);
alter table public.customer_profiles enable row level security;
revoke all on public.customer_profiles from anon;
grant select,update on public.customer_profiles to authenticated;
drop policy if exists "Customer profile read" on public.customer_profiles;
create policy "Customer profile read" on public.customer_profiles for select to authenticated
 using (user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "Customer profile update" on public.customer_profiles;
create policy "Customer profile update" on public.customer_profiles for update to authenticated
 using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
-- Ne JAMAIS autoriser la modification du lien Stripe depuis le navigateur.
revoke update on public.customer_profiles from authenticated;
grant update(display_name) on public.customer_profiles to authenticated;

create or replace function public.init_customer_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.customer_profiles(user_id,email) values (new.id,new.email)
    on conflict(user_id) do update set email=excluded.email;
  return new;
end; $$;
drop trigger if exists auth_user_new_profile on auth.users;
create trigger auth_user_new_profile after insert on auth.users for each row execute function public.init_customer_profile();
insert into public.customer_profiles(user_id,email)
select id,email from auth.users on conflict(user_id) do nothing;

alter table public.orders add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.orders add column if not exists stock_reserved boolean not null default false;
create index if not exists orders_user_recent on public.orders(user_id,created_at desc);

-- Les commandes ne peuvent toujours être modifiées par les clients.
drop policy if exists "Customer read own orders" on public.orders;
create policy "Customer read own orders" on public.orders for select to authenticated
 using (user_id = (select auth.uid()));
drop policy if exists "Customer read own order items" on public.order_items;
create policy "Customer read own order items" on public.order_items for select to authenticated
 using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check(rating between 1 and 5),
  comment text not null check(char_length(btrim(comment)) between 10 and 1500),
  approved boolean not null default false,
  admin_reply text check(admin_reply is null or char_length(admin_reply) <= 1500),
  created_at timestamptz not null default now(),
  unique(entry_id,user_id)
);
create index if not exists reviews_public_idx on public.product_reviews(entry_id,created_at desc) where approved = true;
alter table public.product_reviews enable row level security;
grant select on public.product_reviews to anon,authenticated;
grant insert on public.product_reviews to authenticated;
grant update,delete on public.product_reviews to authenticated;
drop policy if exists "Reviews read" on public.product_reviews;
create policy "Reviews read" on public.product_reviews for select to anon,authenticated
 using (approved = true or user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "Reviews submit" on public.product_reviews;
create policy "Reviews submit" on public.product_reviews for insert to authenticated
 with check (user_id = (select auth.uid()) and approved = false and admin_reply is null
   and exists (select 1 from public.entries e where e.id=entry_id and e.kind='ressource' and e.published and not e.is_hidden));
drop policy if exists "Admin reviews update" on public.product_reviews;
create policy "Admin reviews update" on public.product_reviews for update to authenticated
 using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "Admin reviews delete" on public.product_reviews;
create policy "Admin reviews delete" on public.product_reviews for delete to authenticated
 using ((select public.is_admin()));
-- Aucun avis client publié automatiquement. Modération obligatoire.

create table if not exists public.favorites (
 user_id uuid not null references auth.users(id) on delete cascade,
 entry_id uuid not null references public.entries(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(user_id,entry_id)
);
alter table public.favorites enable row level security;
grant select,insert,delete on public.favorites to authenticated;
drop policy if exists "Own favorites read" on public.favorites;
create policy "Own favorites read" on public.favorites for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists "Own favorites insert" on public.favorites;
create policy "Own favorites insert" on public.favorites for insert to authenticated with check(user_id=(select auth.uid()));
drop policy if exists "Own favorites delete" on public.favorites;
create policy "Own favorites delete" on public.favorites for delete to authenticated using(user_id=(select auth.uid()));

-- RPC atomique: réserve le stock AVANT d'ouvrir Checkout, à l'intérieur d'une transaction PG.
-- La commande doit préexister avec ses lignes; cette fonction n'est accessible que depuis la clé serveur.
create or replace function public.reserve_order_stock(p_order_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare r record; o record;
begin
 select * into o from public.orders where id=p_order_id for update;
 if not found or o.status <> 'pending' or o.stock_reserved then raise exception 'Commande non réservable'; end if;
 for r in
   select i.entry_id, sum(i.quantity)::integer as qty from public.order_items i
   where i.order_id=p_order_id and i.variant='print' group by i.entry_id order by i.entry_id
 loop
   -- UPDATE bloque la ligne; le prédicat empêche la survente sous concurrence.
   update public.entries set print_stock=print_stock-r.qty
   where id=r.entry_id and published and not is_hidden and print_for_sale
     and (print_stock is null or print_stock >= r.qty);
   if not found then raise exception 'Livret épuisé ou indisponible'; end if;
 end loop;
 update public.orders set stock_reserved=true where id=p_order_id;
end $$;
create or replace function public.release_order_stock(p_order_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare r record; o record;
begin
 select * into o from public.orders where id=p_order_id for update;
 if not found or not o.stock_reserved or o.status <> 'pending' then return; end if;
 for r in select entry_id,sum(quantity)::integer as qty from public.order_items
  where order_id=p_order_id and variant='print' and entry_id is not null
  group by entry_id order by entry_id loop
   update public.entries set print_stock=print_stock+r.qty where id=r.entry_id and print_stock is not null;
 end loop;
 update public.orders set stock_reserved=false where id=p_order_id;
end $$;
revoke all on function public.reserve_order_stock(uuid) from public,anon,authenticated;
revoke all on function public.release_order_stock(uuid) from public,anon,authenticated;
grant execute on function public.reserve_order_stock(uuid) to service_role;
grant execute on function public.release_order_stock(uuid) to service_role;

alter table public.orders add column if not exists confirmation_email_sent_at timestamptz;

alter table public.customer_profiles add column if not exists is_blocked boolean not null default false;
-- Les clients suspendus conservent l'accès à leurs commandes déjà payées.
-- Un administrateur peut réactiver le compte sans supprimer son historique.
drop policy if exists "Reviews submit" on public.product_reviews;
create policy "Reviews submit" on public.product_reviews for insert to authenticated
 with check (user_id = (select auth.uid()) and approved = false and admin_reply is null
   and exists(select 1 from public.customer_profiles p where p.user_id=(select auth.uid()) and not p.is_blocked)
   and exists (select 1 from public.entries e where e.id=entry_id and e.kind='ressource' and e.published and not e.is_hidden));

-- Demandes de rétractation en ligne : deux clics et accusé de réception horodaté.
create table if not exists public.withdrawal_requests (
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null references public.orders(id) on delete restrict,
 user_id uuid references auth.users(id) on delete set null,
 email text not null,
 status text not null default 'submitted' check (status in ('submitted','in_review','resolved','rejected')),
 created_at timestamptz not null default now(),
 ack_sent_at timestamptz,
 unique (order_id)
);
create index if not exists withdrawal_requests_created_at on public.withdrawal_requests(created_at desc);
alter table public.withdrawal_requests enable row level security;
revoke all on public.withdrawal_requests from anon,authenticated;
grant select on public.withdrawal_requests to authenticated;
grant update(status) on public.withdrawal_requests to authenticated;
drop policy if exists "Withdrawals own read" on public.withdrawal_requests;
create policy "Withdrawals own read" on public.withdrawal_requests for select to authenticated
 using(user_id=(select auth.uid()) or (select public.is_admin()));
drop policy if exists "Withdrawals admin update" on public.withdrawal_requests;
create policy "Withdrawals admin update" on public.withdrawal_requests for update to authenticated
 using((select public.is_admin())) with check((select public.is_admin()));
