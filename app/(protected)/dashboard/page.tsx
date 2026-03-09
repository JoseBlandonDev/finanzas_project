import { createClient } from "@/lib/supabase/server";
import { toCurrency } from "@/lib/format";

import { DistributionPieChart } from "@/components/dashboard/distribution-pie-chart";

interface DistribucionRecord {
  categoria_id: string;
  monto_asignado: number;
}

interface CategoriaDashboard {
  id: string;
  nombre: string;
  porcentaje: number;
}

interface IngresoIdRecord {
  id: string;
}

interface GastoCategoriaRecord {
  categoria_id: string | null;
  tipo: "gasto" | "ahorro" | "inversion" | "transferencia";
  monto: number;
}

export default async function DashboardPage() {
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

  const [{ data: categorias }, { data: ingresos }, { data: movimientos }] = await Promise.all([
    supabase.from("categorias").select("id,nombre,porcentaje").eq("user_id", user.id),
    supabase.from("ingresos").select("id").eq("user_id", user.id),
    supabase.from("movimientos").select("categoria_id,tipo,monto").eq("user_id", user.id)
  ]);

  const categoriasRows = (categorias ?? []) as CategoriaDashboard[];
  const ingresosRows = (ingresos ?? []) as IngresoIdRecord[];
  const ingresoIds = ingresosRows.map((item) => item.id);
  const movimientosRows = (movimientos ?? []) as GastoCategoriaRecord[];

  let distribuciones: DistribucionRecord[] = [];
  if (ingresoIds.length > 0) {
    const { data } = await supabase
      .from("distribuciones")
      .select("categoria_id,monto_asignado")
      .in("ingreso_id", ingresoIds);

    distribuciones = (data ?? []) as DistribucionRecord[];
  }

  const acumulado = new Map<string, number>();
  const gastadoPorCategoria = new Map<string, number>();
  for (const row of distribuciones) {
    const prev = acumulado.get(row.categoria_id) ?? 0;
    acumulado.set(row.categoria_id, prev + Number(row.monto_asignado));
  }

  for (const row of movimientosRows) {
    if (!row.categoria_id || row.tipo !== "gasto") {
      continue;
    }
    const prev = gastadoPorCategoria.get(row.categoria_id) ?? 0;
    gastadoPorCategoria.set(row.categoria_id, prev + Number(row.monto));
  }

  const pieData = categoriasRows.map((categoria) => ({
    nombre: categoria.nombre,
    valor: acumulado.get(categoria.id) ?? 0
  }));

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-4">
        <h1 className="text-lg font-semibold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-400">Distribucion historica por categoria.</p>
        <DistributionPieChart data={pieData} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {categoriasRows.map((categoria) => {
          const monto = acumulado.get(categoria.id) ?? 0;
          const gastado = gastadoPorCategoria.get(categoria.id) ?? 0;
          const disponible = Math.max(monto - gastado, 0);
          return (
            <article key={categoria.id} className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-gray-400">{categoria.nombre}</p>
              <p className="mt-1 text-xl font-semibold text-white">{toCurrency(disponible)}</p>
              <p className="mt-1 text-xs text-gray-500">Asignado: {toCurrency(monto)} | Gastado: {toCurrency(gastado)}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}