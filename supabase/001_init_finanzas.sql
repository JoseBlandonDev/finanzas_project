-- Finanzas SaaS schema + RLS
-- Compatible with Supabase (PostgreSQL 15+)

create extension if not exists pgcrypto;

create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null check (char_length(trim(nombre)) > 0),
  porcentaje numeric(5,2) not null check (porcentaje > 0 and porcentaje <= 100),
  tiene_tope boolean not null default false,
  monto_tope_maximo numeric(14,2),
  categoria_rebose_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categorias_tope_valido check (
    (tiene_tope = false and monto_tope_maximo is null)
    or
    (tiene_tope = true and monto_tope_maximo is not null and monto_tope_maximo > 0)
  )
);

alter table public.categorias
  add constraint categorias_rebose_fk
  foreign key (categoria_rebose_id)
  references public.categorias(id)
  on delete set null;

alter table public.categorias
  add constraint categorias_no_self_rebose
  check (categoria_rebose_id is null or categoria_rebose_id <> id);

create index if not exists categorias_user_id_idx on public.categorias(user_id);

create table if not exists public.ingresos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  monto_total numeric(14,2) not null check (monto_total > 0),
  descripcion text,
  fecha timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists ingresos_user_id_fecha_idx on public.ingresos(user_id, fecha desc);

create table if not exists public.distribuciones (
  id uuid primary key default gen_random_uuid(),
  ingreso_id uuid not null references public.ingresos(id) on delete cascade,
  categoria_id uuid not null references public.categorias(id) on delete restrict,
  monto_asignado numeric(14,2) not null check (monto_asignado >= 0),
  created_at timestamptz not null default now(),
  constraint distribuciones_unique_ingreso_categoria unique (ingreso_id, categoria_id)
);

create index if not exists distribuciones_ingreso_id_idx on public.distribuciones(ingreso_id);
create index if not exists distribuciones_categoria_id_idx on public.distribuciones(categoria_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_categorias_updated_at on public.categorias;
create trigger trg_categorias_updated_at
before update on public.categorias
for each row
execute function public.set_updated_at();

create or replace function public.validar_total_porcentajes_usuario()
returns trigger
language plpgsql
as $$
declare
  v_user_id uuid;
  v_total numeric(7,2);
begin
  v_user_id := coalesce(new.user_id, old.user_id);

  if v_user_id is null then
    return null;
  end if;

  select coalesce(sum(c.porcentaje), 0)::numeric(7,2)
  into v_total
  from public.categorias c
  where c.user_id = v_user_id;

  if v_total <> 100 then
    raise exception 'La suma de porcentajes para el usuario % debe ser 100. Total actual: %', v_user_id, v_total
      using errcode = '23514';
  end if;

  return null;
end;
$$;

drop trigger if exists trg_validar_total_porcentajes_usuario on public.categorias;
create constraint trigger trg_validar_total_porcentajes_usuario
after insert or update or delete on public.categorias
deferrable initially deferred
for each row
execute function public.validar_total_porcentajes_usuario();

-- RLS
alter table public.categorias enable row level security;
alter table public.ingresos enable row level security;
alter table public.distribuciones enable row level security;

-- categorias policies
drop policy if exists "categorias_select_own" on public.categorias;
create policy "categorias_select_own"
on public.categorias
for select
using (auth.uid() = user_id);

drop policy if exists "categorias_insert_own" on public.categorias;
create policy "categorias_insert_own"
on public.categorias
for insert
with check (auth.uid() = user_id);

drop policy if exists "categorias_update_own" on public.categorias;
create policy "categorias_update_own"
on public.categorias
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "categorias_delete_own" on public.categorias;
create policy "categorias_delete_own"
on public.categorias
for delete
using (auth.uid() = user_id);

-- ingresos policies
drop policy if exists "ingresos_select_own" on public.ingresos;
create policy "ingresos_select_own"
on public.ingresos
for select
using (auth.uid() = user_id);

drop policy if exists "ingresos_insert_own" on public.ingresos;
create policy "ingresos_insert_own"
on public.ingresos
for insert
with check (auth.uid() = user_id);

drop policy if exists "ingresos_update_own" on public.ingresos;
create policy "ingresos_update_own"
on public.ingresos
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "ingresos_delete_own" on public.ingresos;
create policy "ingresos_delete_own"
on public.ingresos
for delete
using (auth.uid() = user_id);

-- distribuciones policies (through ingreso ownership)
drop policy if exists "distribuciones_select_own" on public.distribuciones;
create policy "distribuciones_select_own"
on public.distribuciones
for select
using (
  exists (
    select 1
    from public.ingresos i
    where i.id = distribuciones.ingreso_id
      and i.user_id = auth.uid()
  )
);

drop policy if exists "distribuciones_insert_own" on public.distribuciones;
create policy "distribuciones_insert_own"
on public.distribuciones
for insert
with check (
  exists (
    select 1
    from public.ingresos i
    where i.id = distribuciones.ingreso_id
      and i.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.categorias c
    where c.id = distribuciones.categoria_id
      and c.user_id = auth.uid()
  )
);

drop policy if exists "distribuciones_update_own" on public.distribuciones;
create policy "distribuciones_update_own"
on public.distribuciones
for update
using (
  exists (
    select 1
    from public.ingresos i
    where i.id = distribuciones.ingreso_id
      and i.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.ingresos i
    where i.id = distribuciones.ingreso_id
      and i.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.categorias c
    where c.id = distribuciones.categoria_id
      and c.user_id = auth.uid()
  )
);

drop policy if exists "distribuciones_delete_own" on public.distribuciones;
create policy "distribuciones_delete_own"
on public.distribuciones
for delete
using (
  exists (
    select 1
    from public.ingresos i
    where i.id = distribuciones.ingreso_id
      and i.user_id = auth.uid()
  )
);
