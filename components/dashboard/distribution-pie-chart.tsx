"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface PieDatum {
  nombre: string;
  valor: number;
}

const COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#ef4444", "#14b8a6"];

export function DistributionPieChart({ data }: { data: PieDatum[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-400">No hay datos para mostrar.</p>;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="valor" nameKey="nombre" outerRadius={95}>
            {data.map((entry, index) => (
              <Cell key={entry.nombre} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => {
              const numericValue = typeof value === "number" ? value : Number(value ?? 0);
              return new Intl.NumberFormat("es-MX", {
                style: "currency",
                currency: "MXN"
              }).format(numericValue);
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}