import { registrarMovimiento } from "@/app/(protected)/movimientos/actions";
import { toCurrency } from "@/lib/format";
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

  const [{ data: categorias }, { data: movimientos }] = await Promise.all([
    supabase.from("categorias").select("*").eq("user_id", user.id).order("nombre", { ascending: true }),
    supabase.from("movimientos").select("*").eq("user_id", user.id).order("fecha", { ascending: false }).limit(30)
  ]);

  const categoriasRows = (categorias ?? []) as Categoria[];
  const movimientosRows = (movimientos ?? []) as Movimiento[];
  const nombrePorCategoria = new Map<string, string>(categoriasRows.map((c) => [c.id, c.nombre]));

  return (
    <section className="space-y-4">
      <article className="rounded-xl border border-border bg-card p-4">
        <h1 className="text-lg font-semibold text-white">Registrar gasto / ahorro / inversion</h1>
        <form action={registrarMovimiento} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select name="tipo" defaultValue="gasto" className="rounded-lg border border-border bg-[#111] px-3 py-2">
            <option value="gasto">Gasto</option>
            <option value="ahorro">Ahorro</option>
            <option value="inversion">Inversion</option>
            <option value="transferencia">Transferencia</option>
          </select>
          <input
            name="monto"
            type="number"
            min="0.01"
            step="0.01"
            required
            placeholder="Monto"
            className="rounded-lg border border-border bg-[#111] px-3 py-2"
          />
          <select name="categoria_id" className="rounded-lg border border-border bg-[#111] px-3 py-2">
            <option value="">Sin categoria</option>
            {categoriasRows.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
          <input
            name="descripcion"
            placeholder="Descripcion"
            className="rounded-lg border border-border bg-[#111] px-3 py-2"
          />
          <button type="submit" className="rounded-lg bg-accent px-4 py-2 font-semibold text-black sm:col-span-2">
            Guardar movimiento
          </button>
        </form>
      </article>

      <article className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-base font-semibold text-white">Ultimos movimientos</h2>
        <div className="mt-3 space-y-2">
          {movimientosRows.map((movimiento) => (
            <div
              key={movimiento.id}
              className="flex items-center justify-between rounded-lg border border-border bg-[#151515] px-3 py-2"
            >
              <div>
                <p className="text-sm text-white">
                  {movimiento.tipo.toUpperCase()} - {movimiento.descripcion ?? "Sin descripcion"}
                </p>
                <p className="text-xs text-gray-400">
                  {movimiento.categoria_id ? nombrePorCategoria.get(movimiento.categoria_id) ?? "Categoria" : "Sin categoria"}
                </p>
              </div>
              <p className="text-sm font-semibold text-gray-100">{toCurrency(Number(movimiento.monto))}</p>
            </div>
          ))}
          {movimientosRows.length === 0 ? <p className="text-sm text-gray-400">No hay movimientos registrados.</p> : null}
        </div>
      </article>
    </section>
  );
}
