export function toCurrency(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2
  }).format(value);
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}