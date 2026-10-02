-- ============================================================
-- WHITEBOX MUSIC - Tabla 'artists' (seccion Descubre)
--
-- Agrega la coleccion de artistas de la seccion "Descubre"
-- (descubre.html) para que el panel Backstage pueda administrarla
-- y el sitio publico la consuma.
--
-- IMPORTANTE: este archivo es INCREMENTAL y NO destructivo.
-- No hace DROP de ninguna tabla. Es seguro ejecutarlo aunque
-- ya tengas datos en stories, soundscapes, interviews, gallery,
-- site_content o site_config.
--
-- NO ejecutes supabase-setup.sql para esto: ese archivo si hace
-- DROP de las 6 tablas.
--
-- EJECUTA EN: Supabase Dashboard > SQL Editor.
-- Es re-ejecutable: se puede correr mas de una vez.
-- ============================================================

-- 1) CREAR TABLA ---------------------------------------
create table if not exists public.artists (
  id text primary key,
  name text,
  image text,
  tags jsonb default '[]'::jsonb,
  link text,
  interview text,
  published boolean default false,
  featured boolean default false,
  "order" integer default 1,
  "createdAt" bigint,
  "updatedAt" bigint
);

-- 1b) Si la tabla ya existia sin la columna 'interview', agregala.
alter table public.artists add column if not exists interview text;

-- 2) RLS ------------------------------------------------
alter table public.artists enable row level security;

-- 3) LECTURA PUBLICA (el sitio publico la necesita) ----
drop policy if exists "artists_read" on public.artists;
create policy "artists_read" on public.artists
  for select to anon, authenticated using (true);

-- 4) ESCRITURA SOLO PARA EL PANEL (autenticados) ------
drop policy if exists "artists_insert" on public.artists;
create policy "artists_insert" on public.artists
  for insert to authenticated with check (true);

drop policy if exists "artists_update" on public.artists;
create policy "artists_update" on public.artists
  for update to authenticated using (true);

drop policy if exists "artists_delete" on public.artists;
create policy "artists_delete" on public.artists
  for delete to authenticated using (true);

-- 5) SEMBRAR LOS ARTISTAS QUE YA ESTABAN FIJOS --------
-- Los 4 artistas que estaban fijos en el HTML de descubre.html.
-- Solo se insertan si la tabla esta vacia, para no duplicar.
insert into public.artists (id, name, image, tags, link, interview, published, featured, "order", "createdAt", "updatedAt")
select seed.id, seed.name, seed.image, seed.tags::jsonb, seed.link, '', true, false, seed.ord, 0, 0
from (values
  ('ar-legacy-1', 'Zoe',
   'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg',
   '["SYNTH POP", "DARKWAVE", "GRAN CANARIA"]'::jsonb, '', 1),
  ('ar-legacy-2', 'The Last Internationale',
   'https://images.pexels.com/photos/1644613/pexels-photo-1644613.jpeg',
   '["INDIE ROCK", "ALTERNATIVE", "BARCELONA"]'::jsonb, '', 2),
  ('ar-legacy-3', 'Sia',
   'https://images.pexels.com/photos/257904/pexels-photo-257904.jpeg',
   '["URBAN", "TRAP", "MADRID"]'::jsonb, '', 3),
  ('ar-legacy-4', 'WhiteBox Live',
   'https://images.pexels.com/photos/210922/pexels-photo-210922.jpeg',
   '["SESSIONS", "LONDON"]'::jsonb, '', 4)
) as seed(id, name, image, tags, link, ord)
where not exists (select 1 from public.artists);

-- 6) VERIFICACION --------------------------------------
-- Debe devolver 4 filas (artists_read, insert, update, delete).
select policyname, cmd
from pg_policies
where schemaname = 'public' and tablename = 'artists'
order by cmd;

select id, name, "order", published from public.artists order by "order";
