import { createServerFn } from "@tanstack/react-start";
import { INSTRUMENTS } from "./instruments";
import type { MarketSnapshot, Quote } from "./game-types";

const FALLBACK_USD_CZK = 21.7;
const FALLBACK_EUR_CZK = 24.45;

const FALLBACK_PRICES: Record<string, { usd?: number; czk: number; change24: number }> = {
  btc: { usd: 83800, czk: 1_818_460, change24: 0.4 },
  eth: { usd: 2695, czk: 58_482, change24: 0.2 },
  sol: { usd: 148, czk: 3_212, change24: -0.8 },
  xrp: { usd: 0.62, czk: 13.45, change24: 0.1 },
  spy: { usd: 572, czk: 12_412, change24: 0.15 },
  qqq: { usd: 492, czk: 10_676, change24: 0.2 },
  aapl: { usd: 228, czk: 4_948, change24: -0.3 },
  nvda: { usd: 121, czk: 2_626, change24: 0.9 },
  msft: { usd: 428, czk: 9_288, change24: 0.1 },
  cez: { czk: 1343, change24: -0.15 },
  kb: { czk: 1007, change24: -0.5 },
  gold: { usd: 248, czk: 5_382, change24: 0.4 },
};

async function fetchJson(url: string, timeoutMs = 4000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

function fallbackSnapshot(): MarketSnapshot {
  const quotes: Record<string, Quote> = {};
  for (const inst of INSTRUMENTS) {
    const f = FALLBACK_PRICES[inst.id];
    if (!f) continue;
    quotes[inst.id] = {
      id: inst.id,
      priceUsd: f.usd,
      priceCzk: f.czk,
      change24: f.change24,
    };
  }
  return {
    fetchedAt: Date.now(),
    usdCzk: FALLBACK_USD_CZK,
    eurCzk: FALLBACK_EUR_CZK,
    quotes,
    source: "fallback",
  };
}

function seedQuotes(): Record<string, Quote> {
  const quotes: Record<string, Quote> = {};
  for (const inst of INSTRUMENTS) {
    const f = FALLBACK_PRICES[inst.id];
    if (!f) continue;
    quotes[inst.id] = {
      id: inst.id,
      priceUsd: f.usd,
      priceCzk: f.czk,
      change24: f.change24,
    };
  }
  return quotes;
}

async function loadLive(): Promise<MarketSnapshot> {
  let usdCzk = FALLBACK_USD_CZK;
  let eurCzk = FALLBACK_EUR_CZK;
  const quotes = seedQuotes();
  let live = false;

  try {
    const fx = await fetchJson("https://open.er-api.com/v6/latest/USD", 3500);
    if (fx?.rates?.CZK) usdCzk = Number(fx.rates.CZK);
    if (fx?.rates?.EUR) eurCzk = usdCzk / Number(fx.rates.EUR);
    live = true;
  } catch {
    /* keep fx fallback */
  }

  try {
    const ids = INSTRUMENTS.filter((i) => i.geckoId)
      .map((i) => i.geckoId)
      .join(",");
    const gecko = await fetchJson(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd,czk&include_24hr_change=true`,
      5000,
    );
    for (const inst of INSTRUMENTS) {
      if (!inst.geckoId || !gecko?.[inst.geckoId]) continue;
      const row = gecko[inst.geckoId];
      quotes[inst.id] = {
        id: inst.id,
        priceUsd: Number(row.usd),
        priceCzk: Number(row.czk ?? row.usd * usdCzk),
        change24: Number(row.usd_24h_change ?? 0),
      };
      live = true;
    }
  } catch {
    /* crypto fallback already seeded */
  }

  await Promise.all(
    INSTRUMENTS.filter((i) => i.yahoo).map(async (inst) => {
      try {
        const data = await fetchJson(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(inst.yahoo!)}?interval=1d&range=5d`,
          2500,
        );
        const meta = data?.chart?.result?.[0]?.meta;
        const price = Number(meta?.regularMarketPrice);
        const prev = Number(meta?.chartPreviousClose ?? meta?.previousClose);
        if (!price) return;
        quotes[inst.id] = {
          id: inst.id,
          priceUsd: inst.quote === "USD" ? price : undefined,
          priceCzk: inst.quote === "CZK" ? price : price * usdCzk,
          change24: prev ? ((price - prev) / prev) * 100 : 0,
        };
        live = true;
      } catch {
        /* keep seeded quote */
      }
    }),
  );

  return {
    fetchedAt: Date.now(),
    usdCzk,
    eurCzk,
    quotes,
    source: live ? "live" : "fallback",
  };
}

export const getMarkets = createServerFn({ method: "POST" }).handler(async () => {
  try {
    return await loadLive();
  } catch {
    return fallbackSnapshot();
  }
});
