"use client";

import { useState, useTransition } from "react";

import { registrarMovimiento } from "@/app/(protected)/movimientos/actions";
import { toCurrency } from "@/lib/format";
import type { Categoria, Movimiento } from "@/types/database";

interface Props {
  categorias: Categoria[];
  movimientos: Movimiento[];
}

export function MovimientosManager({ categorias, movimientos }: Props) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>("");
  const nombrePorCategoria = new Map<string, string>(categorias.map((c) => [c.id, c.nombre]));

  return (
    <section className="space-y-4">
      <article className="rounded-xl border border-border bg-card p-4">
        <h1 className="text-lg font-semibold text-white">Registrar gasto / ahorro / inversion</h1>
        <form
          className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
          action={(formData) => {
            startTransition(async () => {
              const result = await registrarMovimiento(formData);
              setMessage(result.message);
            });
          }}
        >
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
            {categorias.map((categoria) => (
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
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-accent px-4 py-2 font-semibold text-black sm:col-span-2"
          >
            Guardar movimiento
          </button>
        </form>
        {message ? <p className="mt-3 text-sm text-gray-300">{message}</p> : null}
      </article>

      <article className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-base font-semibold text-white">Ultimos movimientos</h2>
        <div className="mt-3 space-y-2">
          {movimientos.map((movimiento) => (
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
          {movimientos.length === 0 ? <p className="text-sm text-gray-400">No hay movimientos registrados.</p> : null}
        </div>
      </article>
    </section>
  );
}
