import type { Categoria } from "@/types/database";

import { round2 } from "@/lib/format";

export interface DistributionInput {
  montoTotal: number;
  categorias: Categoria[];
  acumuladoPorCategoria: Record<string, number>;
}

export interface DistributionLine {
  categoriaId: string;
  nombre: string;
  montoAsignado: number;
}

export interface DistributionResult {
  lineas: DistributionLine[];
  totalAsignado: number;
  advertencias: string[];
}

export function calcularDistribucionConTopes(input: DistributionInput): DistributionResult {
  const { montoTotal, categorias, acumuladoPorCategoria } = input;
  const advertencias: string[] = [];

  const lineasMap = new Map<string, DistributionLine>();

  const addToCategoria = (categoriaId: string, nombre: string, monto: number) => {
    const previous = lineasMap.get(categoriaId);
    if (previous) {
      previous.montoAsignado = round2(previous.montoAsignado + monto);
      return;
    }
    lineasMap.set(categoriaId, {
      categoriaId,
      nombre,
      montoAsignado: round2(monto)
    });
  };

  for (const categoria of categorias) {
    const baseAsignado = round2((montoTotal * categoria.porcentaje) / 100);
    if (baseAsignado <= 0) {
      continue;
    }

    if (!categoria.tiene_tope || categoria.monto_tope_maximo === null) {
      addToCategoria(categoria.id, categoria.nombre, baseAsignado);
      continue;
    }

    const acumulado = acumuladoPorCategoria[categoria.id] ?? 0;
    const restante = round2(categoria.monto_tope_maximo - acumulado);

    if (restante <= 0) {
      if (!categoria.categoria_rebose_id) {
        advertencias.push(
          `La categoria ${categoria.nombre} ya esta en tope y no tiene categoria rebose.`
        );
        continue;
      }

      const reboseCategoria = categorias.find((c) => c.id === categoria.categoria_rebose_id);
      if (!reboseCategoria) {
        advertencias.push(
          `La categoria rebose configurada para ${categoria.nombre} no existe.`
        );
        continue;
      }

      addToCategoria(reboseCategoria.id, reboseCategoria.nombre, baseAsignado);
      continue;
    }

    const asignado = Math.min(baseAsignado, restante);
    const excedente = round2(baseAsignado - asignado);

    if (asignado > 0) {
      addToCategoria(categoria.id, categoria.nombre, asignado);
    }

    if (excedente > 0) {
      if (!categoria.categoria_rebose_id) {
        advertencias.push(
          `Excedente de ${categoria.nombre} sin rebose configurado: ${excedente.toFixed(2)}.`
        );
        continue;
      }

      const reboseCategoria = categorias.find((c) => c.id === categoria.categoria_rebose_id);
      if (!reboseCategoria) {
        advertencias.push(
          `No se encontro categoria rebose para ${categoria.nombre}.`
        );
        continue;
      }

      addToCategoria(reboseCategoria.id, reboseCategoria.nombre, excedente);
    }
  }

  const lineas = Array.from(lineasMap.values()).filter((linea) => linea.montoAsignado > 0);
  const totalAsignado = round2(lineas.reduce((acc, item) => acc + item.montoAsignado, 0));

  return { lineas, totalAsignado, advertencias };
}