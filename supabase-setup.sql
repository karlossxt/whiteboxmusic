-- ============================================
-- WHITEBOX MUSIC — Supabase Setup (full)
-- Recrea las 6 tablas de contenido con el
-- esquema exacto que esperan los modelos JS
-- (columnas camelCase), activa RLS y crea el
-- bucket público 'images' de storage.
--
-- ⚠️  ADVERTENCIA: hace DROP de las tablas
-- existentes. ESTÁN VACÍAS (verificado), así
-- que NO hay pérdida de datos. Si tuvieras
-- datos que quieras conservar, haz backup antes.
--
-- EJECUTA EN: Supabase Dashboard > SQL Editor.
-- Es re-ejecutable.
-- ============================================

-- 0) ELIMINAR TABLAS VACÍAS Y RECREAR CON ESQUEMA CORRECTO ----
drop table if exists public.stories;
drop table if exists public.soundscapes;
drop table if exists public.interviews;
drop table if exists public.gallery;
drop table if exists public.site_content;
drop table if exists public.site_config;

create table public.stories (
  id text primary key,
  title text,
  slug text,
  excerpt text,
  category text,
  author text,
  image text,
  content text,
  status text default 'draft',
  featured boolean default false,
  date text,
  "createdAt" bigint,
  "updatedAt" bigint,
  "order" integer default 1,
  location text,
  "relatedSong" text,
  "initialLikes" integer default 0
);

create table public.soundscapes (
  id text primary key,
  title text,
  artist text,
  cover text,
  "spotifyUrl" text,
  "youtubeUrl" text,
  description text,
  category text,
  playlist text,
  duration integer default 180,
  published boolean default false,
  featured boolean default false,
  "order" integer default 1,
  "createdAt" bigint,
  "updatedAt" bigint
);

create table public.interviews (
  id text primary key,
  title text,
  slug text,
  excerpt text,
  content text,
  category text,
  author text,
  cover text,
  "youtubeUrl" text,
  "spotifyUrl" text,
  published boolean default false,
  featured boolean default false,
  "publishDate" text,
  "order" integer default 1,
  "createdAt" bigint,
  "updatedAt" bigint
);

create table public.gallery (
  id text primary key,
  title text,
  subtitle text,
  "cardImage" text,
  intro text,
  "sliderImages" jsonb default '[]'::jsonb,
  "galleryItems" jsonb default '[]'::jsonb,
  "order" integer default 1,
  "updatedAt" text
);

create table public.site_content (
  id text primary key,
  fields jsonb default '{}'::jsonb,
  "updatedAt" bigint default 0
);

create table public.site_config (
  id text primary key,
  "siteName" text,
  tagline text,
  "siteDescription" text,
  "logoUrl" text,
  social jsonb default '{}'::jsonb,
  "contactEmail" text,
  "footerText" text,
  "defaultSeoTitle" text,
  "defaultSeoDescription" text,
  "defaultOgImage" text,
  "updatedAt" bigint default 0
);

-- 1) ACTIVAR RLS ----------------------------------------------
alter table public.stories      enable row level security;
alter table public.soundscapes  enable row level security;
alter table public.interviews   enable row level security;
alter table public.gallery      enable row level security;
alter table public.site_content enable row level security;
alter table public.site_config  enable row level security;

-- 2) LECTURA PÚBLICA (anon + autenticados) ----------------------
create policy "stories_read" on public.stories
  for select to anon, authenticated using (true);
create policy "soundscapes_read" on public.soundscapes
  for select to anon, authenticated using (true);
create policy "interviews_read" on public.interviews
  for select to anon, authenticated using (true);
create policy "gallery_read" on public.gallery
  for select to anon, authenticated using (true);
create policy "site_content_read" on public.site_content
  for select to anon, authenticated using (true);
create policy "site_config_read" on public.site_config
  for select to anon, authenticated using (true);

-- 3) ESCRITURA SOLO PARA EL PANEL (autenticados) ----------------
create policy "stories_insert" on public.stories
  for insert to authenticated with check (true);
create policy "stories_update" on public.stories
  for update to authenticated using (true);
create policy "stories_delete" on public.stories
  for delete to authenticated using (true);

create policy "soundscapes_insert" on public.soundscapes
  for insert to authenticated with check (true);
create policy "soundscapes_update" on public.soundscapes
  for update to authenticated using (true);
create policy "soundscapes_delete" on public.soundscapes
  for delete to authenticated using (true);

create policy "interviews_insert" on public.interviews
  for insert to authenticated with check (true);
create policy "interviews_update" on public.interviews
  for update to authenticated using (true);
create policy "interviews_delete" on public.interviews
  for delete to authenticated using (true);

create policy "gallery_insert" on public.gallery
  for insert to authenticated with check (true);
create policy "gallery_update" on public.gallery
  for update to authenticated using (true);
create policy "gallery_delete" on public.gallery
  for delete to authenticated using (true);

create policy "site_content_insert" on public.site_content
  for insert to authenticated with check (true);
create policy "site_content_update" on public.site_content
  for update to authenticated using (true);
create policy "site_content_delete" on public.site_content
  for delete to authenticated using (true);

create policy "site_config_insert" on public.site_config
  for insert to authenticated with check (true);
create policy "site_config_update" on public.site_config
  for update to authenticated using (true);
create policy "site_config_delete" on public.site_config
  for delete to authenticated using (true);

-- 4) STORAGE: bucket público 'images' ---------------------------
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do update set public = true;

create policy "images_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'images');
create policy "images_update" on storage.objects
  for update to authenticated using (bucket_id = 'images');
create policy "images_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'images');

-- 5) VERIFICACIÓN RÁPIDA ----------------------------------------
-- Debe devolver una fila por cada policy (y mostrar las tablas).
select policyname, tablename, cmd
from pg_policies
where schemaname = 'public'
order by tablename, cmd;