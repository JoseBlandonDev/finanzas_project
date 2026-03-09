"use client";

import { useMemo, useState, useTransition } from "react";

import { crearCategoria, actualizarCategoria, eliminarCategoria } from "@/app/(protected)/categorias/actions";
import type { Categoria } from "@/types/database";

interface Props {
  categorias: Categoria[];
}

export function CategoriasManager({ categorias }: Props) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>("");

  const totalPorcentaje = useMemo(
    () => categorias.reduce((sum, categoria) => sum + Number(categoria.porcentaje), 0),
    [categorias]
  );
  const restante = Math.max(0, 100 - totalPorcentaje);
  const totalCompleto = Math.abs(totalPorcentaje - 100) < 0.01;

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-lg font-semibold text-white">Nueva categoria</h2>
        <p className="mt-1 text-sm text-gray-400">
          Total actual: {totalPorcentaje.toFixed(2)}% - Restante: {restante.toFixed(2)}%
        </p>
        <p className={`mt-1 text-xs ${totalCompleto ? "text-green-400" : "text-amber-300"}`}>
          {totalCompleto
            ? "Listo: ya puedes registrar ingresos."
            : "Debes completar 100% para poder registrar ingresos."}
        </p>

        <form
          className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
          action={(formData) => {
            startTransition(async () => {
              const result = await crearCategoria(formData);
              setMessage(result.message);
            });
          }}
        >
          <input name="nombre" placeholder="Nombre" required className="rounded-lg border border-border bg-[#111] px-3 py-2" />
          <input name="porcentaje" type="number" min="0.01" step="0.01" placeholder="Porcentaje" required className="rounded-lg border border-border bg-[#111] px-3 py-2" />
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input name="tiene_tope" type="checkbox" /> Tiene tope
          </label>
          <input name="monto_tope_maximo" type="number" min="0" step="0.01" placeholder="Tope maximo (opcional)" className="rounded-lg border border-border bg-[#111] px-3 py-2" />
          <select name="categoria_rebose_id" className="rounded-lg border border-border bg-[#111] px-3 py-2">
            <option value="">Categoria rebose</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
          <button disabled={isPending} className="rounded-lg bg-accent px-4 py-2 font-semibold text-black" type="submit">
            Guardar
          </button>
        </form>

        {message ? <p className="mt-3 text-sm text-gray-300">{message}</p> : null}
      </section>

      <section className="space-y-3">
        {categorias.map((categoria) => (
          <form
            key={categoria.id}
            className="rounded-xl border border-border bg-card p-4"
            action={(formData) => {
              startTransition(async () => {
                const result = await actualizarCategoria(formData);
                setMessage(result.message);
              });
            }}
          >
            <input type="hidden" name="id" value={categoria.id} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input defaultValue={categoria.nombre} name="nombre" required className="rounded-lg border border-border bg-[#111] px-3 py-2" />
              <input defaultValue={categoria.porcentaje} name="porcentaje" type="number" min="0.01" step="0.01" required className="rounded-lg border border-border bg-[#111] px-3 py-2" />
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input name="tiene_tope" type="checkbox" defaultChecked={categoria.tiene_tope} /> Tiene tope
              </label>
              <input defaultValue={categoria.monto_tope_maximo ?? ""} name="monto_tope_maximo" type="number" min="0" step="0.01" className="rounded-lg border border-border bg-[#111] px-3 py-2" />
              <select name="categoria_rebose_id" defaultValue={categoria.categoria_rebose_id ?? ""} className="rounded-lg border border-border bg-[#111] px-3 py-2">
                <option value="">Sin rebose</option>
                {categorias
                  .filter((item) => item.id !== categoria.id)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre}
                    </option>
                  ))}
              </select>
              <div className="flex gap-2">
                <button type="submit" disabled={isPending} className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white">
                  Actualizar
                </button>
                <button
                  type="submit"
                  formAction={(formData) => {
                    startTransition(async () => {
                      const result = await eliminarCategoria(formData);
                      setMessage(result.message);
                    });
                  }}
                  disabled={isPending}
                  className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </form>
        ))}
      </section>
    </div>
  );
}