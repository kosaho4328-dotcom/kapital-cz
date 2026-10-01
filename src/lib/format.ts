const czk = new Intl.NumberFormat("cs-CZ", {
  style: "currency",
  currency: "CZK",
  maximumFractionDigits: 0,
});

const czkPrecise = new Intl.NumberFormat("cs-CZ", {
  style: "currency",
  currency: "CZK",
  maximumFractionDigits: 2,
});

const usd = new Intl.NumberFormat("cs-CZ", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const pct = new Intl.NumberFormat("cs-CZ", {
  style: "percent",
  signDisplay: "exceptZero",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCzk(n: number, precise = false) {
  if (!Number.isFinite(n)) return "—";
  return (precise ? czkPrecise : czk).format(n);
}

export function formatUsd(n: number) {
  if (!Number.isFinite(n)) return "—";
  return usd.format(n);
}

export function formatPct(n: number) {
  if (!Number.isFinite(n)) return "—";
  return pct.format(n / 100);
}

export function formatQty(n: number, digits = 6) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("cs-CZ", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString("cs-CZ", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
