-- =====================================================================
-- Actualités publiques de l'Académie (page Actualités et aperçu sur l'accueil).
-- Distinctes des « announcements », qui restent réservées aux membres (cours et université).
-- Lecture publique des actualités publiées ; écriture réservée aux administrateurs.
-- Les images sont déposées dans le bucket public existant « site-assets » (écriture admin).
-- Migration additive.
-- =====================================================================

create table public.news (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 140),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  category text not null default 'actualite' check (category in ('actualite', 'evenement', 'annonce', 'publication', 'opportunite')),
  excerpt text not null default '' check (char_length(excerpt) <= 400),
  body text not null default '' check (char_length(body) <= 50000),
  cover_url text check (cover_url is null or (cover_url ~ '^https://' and char_length(cover_url) <= 1000)),
  event_date timestamptz,
  event_location text not null default '' check (char_length(event_location) <= 300),
  is_published boolean not null default false,
  published_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.news is 'Actualités publiques de l’Académie (actualités, événements, annonces, publications, opportunités).';
create index news_published_idx on public.news (is_published, published_at desc);

create trigger news_set_updated_at before update on public.news for each row execute function public.set_updated_at();
create trigger news_audit after insert or update or delete on public.news for each row execute function public.audit_row_change();

alter table public.news enable row level security;
create policy "news: lecture publique des actualités publiées" on public.news
  for select to anon, authenticated using ((is_published and published_at <= now()) or (select private.is_admin()));
create policy "news: ajout admin" on public.news for insert to authenticated with check ((select private.is_admin()));
create policy "news: modification admin" on public.news for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "news: suppression admin" on public.news for delete to authenticated using ((select private.is_admin()));

grant select on public.news to anon, authenticated;
grant insert, update, delete on public.news to authenticated;
