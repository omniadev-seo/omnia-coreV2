const number = new Intl.NumberFormat("fr-FR");
const currency = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export const formatNumber = (n: number) => number.format(Math.round(n));
export const formatEuros = (n: number) => currency.format(Math.round(n));

export function variation(current: number, previous: number): number {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
}

export function formatVariation(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)} %`;
}
