-- ============================================
-- WHITEBOX MUSIC — Supabase Setup
-- RLS para tablas de contenido + Storage.
--
-- EJECUTA ESTE ARCHIVO EN:
--   Supabase Dashboard > SQL Editor > New query
--
-- Es re-ejecutable (drop policy if exists antes de crear).
-- ============================================

-- 1) ACTIVAR RLS EN LAS TABLAS DE CONTENIDO ---------
alter table public.stories     enable row level security;
alter table public.soundscapes enable row level security;
alter table public.interviews  enable row level security;
alter table public.gallery     enable row level security;
alter table public.site_content enable row level security;
alter table public.site_config  enable row level security;

-- 2) LECTURA PÚBLICA (anon + autenticados) -----------
create policy "stories_read"
  on public.stories for select to anon, authenticated using (true);
create policy "soundscapes_read"
  on public.soundscapes for select to anon, authenticated using (true);
create policy "interviews_read"
  on public.interviews for select to anon, authenticated using (true);
create policy "gallery_read"
  on public.gallery for select to anon, authenticated using (true);
create policy "site_content_read"
  on public.site_content for select to anon, authenticated using (true);
create policy "site_config_read"
  on public.site_config for select to anon, authenticated using (true);

-- 3) ESCRITURA SOLO PARA EL PANEL (autenticados) -----
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

-- 4) STORAGE: bucket público 'images' -----------------
-- Las imágenes se sirven por URL pública (sin auth).
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do update set public = true;

-- Subidas/borrados solo desde el panel (autenticados)
create policy "images_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'images');
create policy "images_update" on storage.objects
  for update to authenticated using (bucket_id = 'images');
create policy "images_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'images');

-- 5) VERIFICACIÓN RÁPIDA ------------------------------
-- Debe devolver una fila por cada policy creada.
select policyname, tablename, cmd
from pg_policies
where schemaname = 'public'
order by tablename, cmd;