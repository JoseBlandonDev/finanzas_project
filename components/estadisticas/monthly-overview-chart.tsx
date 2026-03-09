"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface MonthlyDatum {
  mes: string;
  ingresos: number;
  gastos: number;
}

export function MonthlyOverviewChart({ data }: { data: MonthlyDatum[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-400">No hay datos suficientes para estadisticas.</p>;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis dataKey="mes" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip />
          <Legend />
          <Bar dataKey="ingresos" name="Ingresos" fill="#22c55e" radius={[6, 6, 0, 0]} />
          <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
