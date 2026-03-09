-- Extend finance model: ingreso type + expense/saving/investment movements

alter table public.ingresos
  add column if not exists tipo text not null default 'variable';

alter table public.ingresos
  add constraint ingresos_tipo_check
  check (tipo in ('fijo', 'variable'));

create table if not exists public.movimientos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  categoria_id uuid null references public.categorias(id) on delete set null,
  tipo text not null check (tipo in ('gasto', 'ahorro', 'inversion', 'transferencia')),
  monto numeric(14,2) not null check (monto > 0),
  descripcion text,
  fecha timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists movimientos_user_id_fecha_idx on public.movimientos(user_id, fecha desc);
create index if not exists movimientos_categoria_id_idx on public.movimientos(categoria_id);

alter table public.movimientos enable row level security;

drop policy if exists "movimientos_select_own" on public.movimientos;
create policy "movimientos_select_own"
on public.movimientos
for select
using (auth.uid() = user_id);

drop policy if exists "movimientos_insert_own" on public.movimientos;
create policy "movimientos_insert_own"
on public.movimientos
for insert
with check (
  auth.uid() = user_id
  and (
    categoria_id is null
    or exists (
      select 1
      from public.categorias c
      where c.id = movimientos.categoria_id
        and c.user_id = auth.uid()
    )
  )
);

drop policy if exists "movimientos_update_own" on public.movimientos;
create policy "movimientos_update_own"
on public.movimientos
for update
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (
    categoria_id is null
    or exists (
      select 1
      from public.categorias c
      where c.id = movimientos.categoria_id
        and c.user_id = auth.uid()
    )
  )
);

drop policy if exists "movimientos_delete_own" on public.movimientos;
create policy "movimientos_delete_own"
on public.movimientos
for delete
using (auth.uid() = user_id);
