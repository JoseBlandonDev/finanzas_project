"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { MovimientoInsert } from "@/types/database";

const TIPOS = new Set(["gasto", "ahorro", "inversion", "transferencia"]);

export async function registrarMovimiento(formData: FormData): Promise<void> {
  const supabase = await createClient();
  if (!supabase) {
    return;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const tipoRaw = String(formData.get("tipo") ?? "gasto");
  const tipo = TIPOS.has(tipoRaw) ? (tipoRaw as MovimientoInsert["tipo"]) : "gasto";
  const monto = Number(formData.get("monto") ?? 0);
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const categoriaIdRaw = String(formData.get("categoria_id") ?? "").trim();
  const categoriaId = categoriaIdRaw.length > 0 ? categoriaIdRaw : null;

  if (!Number.isFinite(monto) || monto <= 0) {
    return;
  }

  const payload: MovimientoInsert = {
    user_id: user.id,
    categoria_id: categoriaId,
    tipo,
    monto,
    descripcion: descripcion || null
  };

  const { error } = await supabase.from("movimientos").insert(payload);
  if (error) {
    return;
  }

  revalidatePath("/movimientos");
  revalidatePath("/dashboard");
  revalidatePath("/estadisticas");

  return;
}
