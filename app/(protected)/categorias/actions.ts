"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

interface ActionResult {
  ok: boolean;
  message: string;
}

function parseNumber(value: FormDataEntryValue | null): number {
  if (typeof value !== "string") {
    return 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function validarTotalPorcentajes(userId: string, candidate: number, excludeId?: string): Promise<boolean> {
  const supabase = await createClient();
  if (!supabase) {
    return false;
  }

  const { data } = await supabase.from("categorias").select("id,porcentaje").eq("user_id", userId);
  const categorias = (data ?? []) as Array<{ id: string; porcentaje: number }>;

  const totalActual = categorias
    .filter((categoria) => (excludeId ? categoria.id !== excludeId : true))
    .reduce((sum, categoria) => sum + Number(categoria.porcentaje), 0);

  return Math.abs(totalActual + candidate - 100) < 0.01;
}

export async function crearCategoria(formData: FormData): Promise<ActionResult> {
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

  const nombre = String(formData.get("nombre") ?? "").trim();
  const porcentaje = parseNumber(formData.get("porcentaje"));
  const tieneTope = formData.get("tiene_tope") === "on";
  const montoTopeMaximo = tieneTope ? parseNumber(formData.get("monto_tope_maximo")) : null;
  const categoriaReboseId = String(formData.get("categoria_rebose_id") ?? "").trim() || null;

  if (!nombre || porcentaje <= 0) {
    return { ok: false, message: "Nombre y porcentaje son obligatorios." };
  }

  const totalValido = await validarTotalPorcentajes(user.id, porcentaje);
  if (!totalValido) {
    return { ok: false, message: "La suma total de porcentajes debe ser exactamente 100%." };
  }

  const { error } = await supabase.from("categorias").insert({
    user_id: user.id,
    nombre,
    porcentaje,
    tiene_tope: tieneTope,
    monto_tope_maximo: tieneTope ? montoTopeMaximo : null,
    categoria_rebose_id: categoriaReboseId
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/categorias");
  revalidatePath("/nuevo-ingreso");
  revalidatePath("/dashboard");

  return { ok: true, message: "Categoria creada." };
}

export async function actualizarCategoria(formData: FormData): Promise<ActionResult> {
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

  const id = String(formData.get("id") ?? "").trim();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const porcentaje = parseNumber(formData.get("porcentaje"));
  const tieneTope = formData.get("tiene_tope") === "on";
  const montoTopeMaximo = tieneTope ? parseNumber(formData.get("monto_tope_maximo")) : null;
  const categoriaReboseId = String(formData.get("categoria_rebose_id") ?? "").trim() || null;

  if (!id || !nombre || porcentaje <= 0) {
    return { ok: false, message: "Datos invalidos para actualizar categoria." };
  }

  const totalValido = await validarTotalPorcentajes(user.id, porcentaje, id);
  if (!totalValido) {
    return { ok: false, message: "La suma total de porcentajes debe ser exactamente 100%." };
  }

  const { error } = await supabase
    .from("categorias")
    .update({
      nombre,
      porcentaje,
      tiene_tope: tieneTope,
      monto_tope_maximo: tieneTope ? montoTopeMaximo : null,
      categoria_rebose_id: categoriaReboseId,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/categorias");
  revalidatePath("/nuevo-ingreso");
  revalidatePath("/dashboard");

  return { ok: true, message: "Categoria actualizada." };
}

export async function eliminarCategoria(formData: FormData): Promise<ActionResult> {
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

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    return { ok: false, message: "Categoria invalida." };
  }

  const { error } = await supabase.from("categorias").delete().eq("id", id).eq("user_id", user.id);
  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/categorias");
  revalidatePath("/nuevo-ingreso");
  revalidatePath("/dashboard");

  return { ok: true, message: "Categoria eliminada." };
}