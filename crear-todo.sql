-- =====================================================================
-- TAP NOVA MEMORIES · VERSIÓN LITE  ·  UN SOLO SCRIPT
-- Pégalo completo en Supabase → SQL Editor → New query → Run.
-- Es seguro ejecutarlo otra vez (no borra nada).
--
-- Qué crea (en palabras sencillas):
--   · Una TABLA "album_fotos": una fila por foto (quién la subió, su
--     dedicatoria, y dónde está el archivo).
--   · Una CARPETA en la nube llamada "album" para guardar las imágenes.
--   · Las REGLAS de la puerta (seguridad): cualquiera puede VER las fotos
--     visibles y SUBIR una nueva. Nadie (salvo tú, desde tu panel de
--     Supabase) puede borrar, cambiar ni esconder fotos.
--   · El AVISO EN VIVO para que las fotos nuevas aparezcan solas.
--
-- NO hay usuarios, contraseñas ni panel de administrador. Para quitar
-- una foto, entras a tu Supabase (Table Editor) y la borras o la
-- escondes. Eso es todo.
-- =====================================================================

-- 1) LA TABLA ---------------------------------------------------------
create table if not exists public.album_fotos (
  id           uuid primary key default gen_random_uuid(),
  evento_slug  text not null check (evento_slug ~ '^[a-z0-9][a-z0-9-]{1,40}$'),
  nombre       text not null check (char_length(btrim(nombre)) between 1 and 60),
  dedicatoria  text not null default '' check (char_length(dedicatoria) <= 250),
  ruta         text not null unique,
  -- true  = la foto se ve en el álbum.
  -- false = escondida (solo tú la ves en tu panel de Supabase).
  -- Para REVISAR ANTES de publicar, ver el final de este archivo.
  visible      boolean not null default true,
  creado_en    timestamptz not null default now(),
  -- La ruta del archivo debe ser exactamente "evento/uuid.jpg" y vivir
  -- en la carpeta de SU evento: una foto de un cumpleaños no puede
  -- guardarse en la carpeta de otro.
  constraint ruta_formato_valido check (
    ruta ~ ('^' || evento_slug || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$')
  )
);

create index if not exists album_fotos_evento_idx
  on public.album_fotos (evento_slug, visible, creado_en desc);

-- 2) EL "GUARDIÁN": revisa cada foto nueva antes de guardarla ----------
--    · Máximo de fotos por cumpleaños (cámbialo si quieres: 150).
--    · La fecha la pone el servidor, no el visitante.
create or replace function public.album_fotos_antes_de_insertar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  maximo constant int := 150;
  total  int;
begin
  select count(*) into total from public.album_fotos where evento_slug = new.evento_slug;
  if total >= maximo then
    raise exception 'Este álbum alcanzó su límite de fotos';
  end if;
  new.creado_en   := now();
  new.nombre      := btrim(new.nombre);
  new.dedicatoria := btrim(new.dedicatoria);
  return new;
end;
$$;

drop trigger if exists album_fotos_antes_de_insertar on public.album_fotos;
create trigger album_fotos_antes_de_insertar
  before insert on public.album_fotos
  for each row execute function public.album_fotos_antes_de_insertar();

-- 3) LAS REGLAS DE LA PUERTA (RLS) -------------------------------------
alter table public.album_fotos enable row level security;
revoke all on public.album_fotos from anon, authenticated;

-- Cualquiera puede VER las fotos visibles.
grant select on public.album_fotos to anon, authenticated;
drop policy if exists album_ver on public.album_fotos;
create policy album_ver on public.album_fotos
  for select to anon, authenticated
  using (visible);

-- Cualquiera puede SUBIR una foto nueva, pero solo escribiendo estas
-- 4 columnas (no puede decidir si es visible, ni la fecha, ni el id).
grant insert (evento_slug, nombre, dedicatoria, ruta) on public.album_fotos to anon, authenticated;
drop policy if exists album_subir on public.album_fotos;
create policy album_subir on public.album_fotos
  for insert to anon, authenticated
  with check (true);

-- No existe ninguna regla para editar ni borrar: los visitantes NO pueden.
-- Tú sí puedes desde tu panel de Supabase (Table Editor), que tiene
-- permisos de dueño del proyecto.

-- 4) LA CARPETA EN LA NUBE (Storage) -----------------------------------
-- Pública para MIRAR las fotos por su enlace (los nombres son aleatorios).
-- Máximo 3 MB por archivo y solo JPEG.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('album', 'album', true, 3145728, array['image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "album_subir_archivo" on storage.objects;
-- Los visitantes solo pueden SUBIR archivos nuevos con nombre
-- "evento/uuid.jpg". No pueden listar, reemplazar ni borrar.
create policy "album_subir_archivo" on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'album'
    and name ~ '^[a-z0-9][a-z0-9-]{1,40}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$'
  );

-- 5) AVISO EN VIVO (Realtime) ------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'album_fotos'
  ) then
    alter publication supabase_realtime add table public.album_fotos;
  end if;
end $$;

-- =====================================================================
-- OPCIONAL · "REVISAR ANTES DE PUBLICAR"
-- Por defecto las fotos se publican AL INSTANTE (visible = true).
-- Si prefieres aprobar cada foto antes de que se vea, ejecuta aparte
-- (solo esta línea):
--
--   alter table public.album_fotos alter column visible set default false;
--
-- Entonces cada foto nueva llega escondida y tú la publicas en
-- Table Editor → album_fotos, marcando la casilla "visible".
-- Para volver a publicar al instante:
--
--   alter table public.album_fotos alter column visible set default true;
-- =====================================================================
