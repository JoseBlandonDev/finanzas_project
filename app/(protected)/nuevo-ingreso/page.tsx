import { NuevoIngresoForm } from "@/components/ingresos/nuevo-ingreso-form";
import { createClient } from "@/lib/supabase/server";
import type { Categoria } from "@/types/database";

interface DistribucionRecord {
  categoria_id: string;
  monto_asignado: number;
}

interface IngresoIdRecord {
  id: string;
}

export default async function NuevoIngresoPage() {
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

  const [{ data: categorias }, { data: ingresos }] = await Promise.all([
    supabase.from("categorias").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
    supabase.from("ingresos").select("id").eq("user_id", user.id)
  ]);

  const ingresosRows = (ingresos ?? []) as IngresoIdRecord[];
  const ingresoIds = ingresosRows.map((item) => item.id);
  const acumuladoPorCategoria: Record<string, number> = {};

  if (ingresoIds.length > 0) {
    const { data: distribuciones } = await supabase
      .from("distribuciones")
      .select("categoria_id,monto_asignado")
      .in("ingreso_id", ingresoIds);

    for (const item of (distribuciones ?? []) as DistribucionRecord[]) {
      const previous = acumuladoPorCategoria[item.categoria_id] ?? 0;
      acumuladoPorCategoria[item.categoria_id] = previous + Number(item.monto_asignado);
    }
  }

  const categoriasRows = (categorias ?? []) as Categoria[];
  return <NuevoIngresoForm categorias={categoriasRows} acumuladoPorCategoria={acumuladoPorCategoria} />;
}