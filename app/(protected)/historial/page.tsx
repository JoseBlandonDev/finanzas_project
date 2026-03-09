import { createClient } from "@/lib/supabase/server";
import { toCurrency } from "@/lib/format";

interface HistorialPageProps {
  searchParams: {
    mes?: string;
  };
}

interface IngresoHistorial {
  id: string;
  monto_total: number;
  tipo: "fijo" | "variable";
  descripcion: string | null;
  fecha: string;
}

interface MovimientoHistorial {
  id: string;
  tipo: "gasto" | "ahorro" | "inversion" | "transferencia";
  monto: number;
  descripcion: string | null;
  fecha: string;
}

function getMonthRange(mes?: string): { start: string; end: string; value: string } {
  const now = new Date();
  const fallback = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const selected = mes && /^\d{4}-\d{2}$/.test(mes) ? mes : fallback;

  const [yearStr, monthStr] = selected.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    value: selected
  };
}

export default async function HistorialPage({ searchParams }: HistorialPageProps) {
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

  const range = getMonthRange(searchParams.mes);

  const [{ data: ingresos }, { data: movimientos }] = await Promise.all([
    supabase
      .from("ingresos")
      .select("id,monto_total,tipo,descripcion,fecha")
      .eq("user_id", user.id)
      .gte("fecha", range.start)
      .lt("fecha", range.end)
      .order("fecha", { ascending: false }),
    supabase
      .from("movimientos")
      .select("id,tipo,monto,descripcion,fecha")
      .eq("user_id", user.id)
      .gte("fecha", range.start)
      .lt("fecha", range.end)
      .order("fecha", { ascending: false })
  ]);

  const ingresosRows = (ingresos ?? []) as IngresoHistorial[];
  const movimientosRows = (movimientos ?? []) as MovimientoHistorial[];

  return (
    <section className="space-y-4">
      <header className="rounded-xl border border-border bg-card p-4">
        <h1 className="text-lg font-semibold text-white">Historial</h1>
        <form className="mt-3 flex items-center gap-3" method="get">
          <input
            type="month"
            name="mes"
            defaultValue={range.value}
            className="rounded-lg border border-border bg-[#111] px-3 py-2"
          />
          <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black">
            Filtrar
          </button>
        </form>
      </header>

      <div className="space-y-2">
        {ingresosRows.map((ingreso) => (
          <article key={ingreso.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-base font-semibold text-white">{toCurrency(Number(ingreso.monto_total))}</p>
              <p className="text-xs text-gray-400">{new Date(ingreso.fecha).toLocaleString("es-MX")}</p>
            </div>
            <p className="mt-1 text-xs uppercase text-green-400">Ingreso {ingreso.tipo}</p>
            <p className="mt-1 text-sm text-gray-300">{ingreso.descripcion ?? "Sin descripcion"}</p>
          </article>
        ))}
        {ingresosRows.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-4 text-sm text-gray-400">No hay ingresos para este mes.</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <h2 className="text-base font-semibold text-white">Movimientos del mes</h2>
        {movimientosRows.map((movimiento) => (
          <article key={movimiento.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-base font-semibold text-white">{toCurrency(Number(movimiento.monto))}</p>
              <p className="text-xs text-gray-400">{new Date(movimiento.fecha).toLocaleString("es-MX")}</p>
            </div>
            <p className="mt-1 text-xs uppercase text-amber-300">{movimiento.tipo}</p>
            <p className="mt-1 text-sm text-gray-300">{movimiento.descripcion ?? "Sin descripcion"}</p>
          </article>
        ))}
        {movimientosRows.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-4 text-sm text-gray-400">No hay movimientos para este mes.</p>
        ) : null}
      </div>
    </section>
  );
}