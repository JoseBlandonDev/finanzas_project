"use client";

import { useMemo, useState, useTransition } from "react";

import { registrarIngreso } from "@/app/(protected)/nuevo-ingreso/actions";
import { calcularDistribucionConTopes } from "@/lib/distribution";
import { toCurrency } from "@/lib/format";
import type { Categoria } from "@/types/database";

interface Props {
  categorias: Categoria[];
  acumuladoPorCategoria: Record<string, number>;
}

export function NuevoIngresoForm({ categorias, acumuladoPorCategoria }: Props) {
  const [isPending, startTransition] = useTransition();
  const [monto, setMonto] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const montoNumber = Number(monto || 0);

  const preview = useMemo(() => {
    if (!Number.isFinite(montoNumber) || montoNumber <= 0) {
      return { lineas: [], totalAsignado: 0, advertencias: [] as string[] };
    }
    return calcularDistribucionConTopes({
      montoTotal: montoNumber,
      categorias,
      acumuladoPorCategoria
    });
  }, [montoNumber, categorias, acumuladoPorCategoria]);

  return (
    <section className="space-y-5">
      <form
        className="rounded-xl border border-border bg-card p-4"
        action={(formData) => {
          startTransition(async () => {
            const result = await registrarIngreso(formData);
            setMessage(result.message);
          });
        }}
      >
        <h1 className="text-lg font-semibold text-white">Nuevo ingreso</h1>
        <p className="mt-1 text-sm text-gray-400">Vista previa en tiempo real de la distribucion.</p>

        <div className="mt-4 grid grid-cols-1 gap-3">
          <input
            name="monto_total"
            type="number"
            min="0.01"
            step="0.01"
            required
            value={monto}
            onChange={(event) => setMonto(event.target.value)}
            placeholder="Monto total"
            className="rounded-lg border border-border bg-[#111] px-3 py-2"
          />
          <input
            name="descripcion"
            placeholder="Descripcion (opcional)"
            className="rounded-lg border border-border bg-[#111] px-3 py-2"
          />
          <button disabled={isPending} type="submit" className="rounded-lg bg-accent px-4 py-2 font-semibold text-black">
            Registrar ingreso
          </button>
          {message ? <p className="text-sm text-gray-300">{message}</p> : null}
        </div>
      </form>

      <article className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-base font-semibold text-white">Previsualizacion</h2>
        <p className="mt-1 text-sm text-gray-400">Total asignado: {toCurrency(preview.totalAsignado)}</p>

        <div className="mt-3 space-y-2">
          {preview.lineas.map((linea) => (
            <div key={linea.categoriaId} className="flex items-center justify-between rounded-lg border border-border bg-[#141414] px-3 py-2 text-sm">
              <span>{linea.nombre}</span>
              <span className="font-semibold text-green-400">{toCurrency(linea.montoAsignado)}</span>
            </div>
          ))}
          {preview.lineas.length === 0 ? <p className="text-sm text-gray-500">Ingresa un monto para calcular.</p> : null}
        </div>

        {preview.advertencias.length > 0 ? (
          <div className="mt-3 rounded-lg border border-yellow-700 bg-yellow-950/40 p-3 text-sm text-yellow-200">
            {preview.advertencias.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        ) : null}
      </article>
    </section>
  );
}