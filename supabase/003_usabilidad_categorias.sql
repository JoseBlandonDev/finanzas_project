-- Improve UX for category setup:
-- Allow users to create/edit categories incrementally instead of forcing 100% on every write.
-- Total 100% is still enforced before registering incomes in app logic.

drop trigger if exists trg_validar_total_porcentajes_usuario on public.categorias;
drop function if exists public.validar_total_porcentajes_usuario();
