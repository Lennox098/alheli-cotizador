-- =====================================================================
-- Alhelí · Cotizador — base de datos en Supabase (plan gratuito)
-- Pegue todo este archivo en Supabase → SQL Editor → New query → Run.
-- =====================================================================

-- Una sola tabla guarda todo: cotizaciones, catálogo, plantillas y ajustes.
create table if not exists public.registros (
  id          text primary key,                 -- 'settings', 'catalog', 'recipes' o 'q_<id>'
  tipo        text not null,                    -- settings | catalog | recipes | quote
  datos       jsonb not null,                   -- el contenido completo
  actualizado timestamptz not null default now()
);

create index if not exists registros_tipo_idx on public.registros (tipo);

-- Seguridad: SOLO usuarios que inician sesión pueden leer o escribir.
alter table public.registros enable row level security;

drop policy if exists "leer autenticados"      on public.registros;
drop policy if exists "insertar autenticados"  on public.registros;
drop policy if exists "editar autenticados"    on public.registros;
drop policy if exists "borrar autenticados"    on public.registros;

create policy "leer autenticados"     on public.registros for select to authenticated using (true);
create policy "insertar autenticados" on public.registros for insert to authenticated with check (true);
create policy "editar autenticados"   on public.registros for update to authenticated using (true) with check (true);
create policy "borrar autenticados"   on public.registros for delete to authenticated using (true);

-- IMPORTANTE (se hace en el panel, no aquí):
--   Authentication → Sign In / Providers → Email → desactive "Allow new users to sign up"
--   para que nadie más pueda crearse una cuenta. Usted crea los usuarios en
--   Authentication → Users → Add user (uno para usted y otro para el contador).
