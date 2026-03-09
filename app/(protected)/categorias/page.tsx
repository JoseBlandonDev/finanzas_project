import { CategoriasManager } from "@/components/categorias/categorias-manager";
import { createClient } from "@/lib/supabase/server";
import type { Categoria } from "@/types/database";

export default async function CategoriasPage() {
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

  const { data: categorias } = await supabase
    .from("categorias")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const categoriasRows = (categorias ?? []) as Categoria[];

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold text-white">Configuracion de categorias</h1>
      <CategoriasManager categorias={categoriasRows} />
    </section>
  );
}