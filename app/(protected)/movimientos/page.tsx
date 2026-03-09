import { MovimientosManager } from "@/components/movimientos/movimientos-manager";
import { createClient } from "@/lib/supabase/server";
import type { Categoria, Movimiento } from "@/types/database";

export default async function MovimientosPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <section className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm text-red-300">Variables de entorno de Supabase faltantes.</p>
      </section>
    );
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [{ data: categorias }, { data: movimientos, error: movimientosError }] = await Promise.all([
    supabase.from("categorias").select("*").eq("user_id", user.id).order("nombre", { ascending: true }),
    supabase.from("movimientos").select("*").eq("user_id", user.id).order("fecha", { ascending: false }).limit(30)
  ]);

  const categoriasRows = (categorias ?? []) as Categoria[];
  const movimientosRows = (movimientos ?? []) as Movimiento[];

  return (
    <section className="space-y-4">
      {movimientosError ? (
        <article className="rounded-xl border border-yellow-700 bg-yellow-950/40 p-4 text-sm text-yellow-200">
          Para usar esta seccion ejecuta en Supabase el script `supabase/002_movimientos_y_estadisticas.sql`.
        </article>
      ) : null}
      <MovimientosManager categorias={categoriasRows} movimientos={movimientosRows} />
    </section>
  );
}
