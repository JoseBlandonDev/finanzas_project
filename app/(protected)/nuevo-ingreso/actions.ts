"use server";

import { revalidatePath } from "next/cache";

import { calcularDistribucionConTopes } from "@/lib/distribution";
import { createClient } from "@/lib/supabase/server";
import type { Categoria } from "@/types/database";

interface ActionResult {
  ok: boolean;
  message: string;
}

interface IngresoIdRecord {
  id: string;
}

interface DistribucionRecord {
  categoria_id: string;
  monto_asignado: number;
}

export async function registrarIngreso(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Variables de entorno faltantes." };
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "No autenticado." };
  }

  const montoTotal = Number(formData.get("monto_total") ?? 0);
  const descripcion = String(formData.get("descripcion") ?? "").trim();

  if (!Number.isFinite(montoTotal) || montoTotal <= 0) {
    return { ok: false, message: "Monto total invalido." };
  }

  const { data: categorias, error: categoriasError } = await supabase
    .from("categorias")
    .select("*")
    .eq("user_id", user.id);

  if (categoriasError) {
    return { ok: false, message: categoriasError.message };
  }

  const categoriasRows = (categorias ?? []) as Categoria[];

  if (categoriasRows.length === 0) {
    return { ok: false, message: "No hay categorias para distribuir." };
  }

  const totalPorcentaje = categoriasRows.reduce((sum, categoria) => sum + Number(categoria.porcentaje), 0);
  if (Math.abs(totalPorcentaje - 100) > 0.01) {
    return { ok: false, message: "Las categorias deben sumar 100% para registrar ingresos." };
  }

  const { data: ingresos } = await supabase.from("ingresos").select("id").eq("user_id", user.id);
  const ingresosRows = (ingresos ?? []) as IngresoIdRecord[];
  const ingresoIds = ingresosRows.map((item) => item.id);

  const acumuladoPorCategoria: Record<string, number> = {};

  if (ingresoIds.length > 0) {
    const { data: distribuciones, error: distError } = await supabase
      .from("distribuciones")
      .select("categoria_id,monto_asignado")
      .in("ingreso_id", ingresoIds);

    if (distError) {
      return { ok: false, message: distError.message };
    }

    for (const item of (distribuciones ?? []) as DistribucionRecord[]) {
      const prev = acumuladoPorCategoria[item.categoria_id] ?? 0;
      acumuladoPorCategoria[item.categoria_id] = prev + Number(item.monto_asignado);
    }
  }

  const resultado = calcularDistribucionConTopes({
    montoTotal,
    categorias: categoriasRows,
    acumuladoPorCategoria
  });

  if (resultado.lineas.length === 0) {
    return { ok: false, message: "No fue posible distribuir el ingreso con las reglas actuales." };
  }

  const { data: ingresoCreado, error: ingresoError } = await supabase
    .from("ingresos")
    .insert({
      user_id: user.id,
      monto_total: montoTotal,
      descripcion: descripcion || null
    })
    .select("id")
    .single();

  if (ingresoError || !ingresoCreado) {
    return { ok: false, message: ingresoError?.message ?? "No se pudo crear el ingreso." };
  }

  const inserts = resultado.lineas.map((linea) => ({
    ingreso_id: ingresoCreado.id,
    categoria_id: linea.categoriaId,
    monto_asignado: linea.montoAsignado
  }));

  const { error: distribucionError } = await supabase.from("distribuciones").insert(inserts);

  if (distribucionError) {
    await supabase.from("ingresos").delete().eq("id", ingresoCreado.id).eq("user_id", user.id);
    return { ok: false, message: distribucionError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/historial");
  revalidatePath("/nuevo-ingreso");

  const warningText = resultado.advertencias.length > 0 ? ` Advertencias: ${resultado.advertencias.join(" | ")}` : "";
  return { ok: true, message: `Ingreso registrado correctamente.${warningText}` };
}