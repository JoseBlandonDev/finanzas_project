import { MonthlyOverviewChart } from "@/components/estadisticas/monthly-overview-chart";
import { toCurrency } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Categoria, Ingreso, Movimiento } from "@/types/database";

interface MonthlyDatum {
  mes: string;
  ingresos: number;
  gastos: number;
}

function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export default async function EstadisticasPage() {
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

  const [{ data: ingresos }, { data: movimientos, error: movimientosError }, { data: categorias }] = await Promise.all([
    supabase.from("ingresos").select("*").eq("user_id", user.id).order("fecha", { ascending: true }),
    supabase.from("movimientos").select("*").eq("user_id", user.id).order("fecha", { ascending: true }),
    supabase.from("categorias").select("*").eq("user_id", user.id)
  ]);

  const ingresosRows = (ingresos ?? []) as Ingreso[];
  const movimientosRows = (movimientos ?? []) as Movimiento[];
  const categoriasRows = (categorias ?? []) as Categoria[];

  const monthlyMap = new Map<string, MonthlyDatum>();

  for (const ingreso of ingresosRows) {
    const key = monthKey(ingreso.fecha);
    const row = monthlyMap.get(key) ?? { mes: key, ingresos: 0, gastos: 0 };
    row.ingresos += Number(ingreso.monto_total);
    monthlyMap.set(key, row);
  }

  for (const mov of movimientosRows) {
    if (mov.tipo !== "gasto") {
      continue;
    }
    const key = monthKey(mov.fecha);
    const row = monthlyMap.get(key) ?? { mes: key, ingresos: 0, gastos: 0 };
    row.gastos += Number(mov.monto);
    monthlyMap.set(key, row);
  }

  const monthlyData = Array.from(monthlyMap.values())
    .sort((a, b) => a.mes.localeCompare(b.mes))
    .slice(-12);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const gastoPorCategoria = new Map<string, number>();

  for (const mov of movimientosRows) {
    if (mov.tipo !== "gasto" || !mov.categoria_id || monthKey(mov.fecha) !== currentMonth) {
      continue;
    }
    const prev = gastoPorCategoria.get(mov.categoria_id) ?? 0;
    gastoPorCategoria.set(mov.categoria_id, prev + Number(mov.monto));
  }

  return (
    <section className="space-y-4">
      {movimientosError ? (
        <article className="rounded-xl border border-yellow-700 bg-yellow-950/40 p-4 text-sm text-yellow-200">
          Ejecuta en Supabase el script `supabase/002_movimientos_y_estadisticas.sql` para habilitar estadisticas completas.
        </article>
      ) : null}
      <article className="rounded-xl border border-border bg-card p-4">
        <h1 className="text-lg font-semibold text-white">Panel estadistico</h1>
        <p className="mt-1 text-sm text-gray-400">Ingresos y gastos por mes (ultimos 12 meses).</p>
        <MonthlyOverviewChart data={monthlyData} />
      </article>

      <article className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-base font-semibold text-white">Gasto por categoria (mes actual)</h2>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {categoriasRows.map((categoria) => (
            <div key={categoria.id} className="rounded-lg border border-border bg-[#151515] px-3 py-2">
              <p className="text-sm text-gray-300">{categoria.nombre}</p>
              <p className="text-lg font-semibold text-red-300">{toCurrency(gastoPorCategoria.get(categoria.id) ?? 0)}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
