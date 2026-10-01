export type AssetClass = "crypto" | "stock" | "etf";

export type Instrument = {
  id: string;
  symbol: string;
  name: string;
  klass: AssetClass;
  geckoId?: string;
  yahoo?: string;
  quote: "USD" | "CZK";
  tutorial?: string;
};

export const INSTRUMENTS: Instrument[] = [
  {
    id: "btc",
    symbol: "BTC",
    name: "Bitcoin",
    klass: "crypto",
    geckoId: "bitcoin",
    quote: "USD",
    tutorial:
      "Decentralizovaná kryptoměna. Vysoká volatilita. V Česku platí 3letý časový test a limit příjmů 100 000 Kč.",
  },
  {
    id: "eth",
    symbol: "ETH",
    name: "Ethereum",
    klass: "crypto",
    geckoId: "ethereum",
    quote: "USD",
  },
  {
    id: "sol",
    symbol: "SOL",
    name: "Solana",
    klass: "crypto",
    geckoId: "solana",
    quote: "USD",
  },
  {
    id: "xrp",
    symbol: "XRP",
    name: "XRP",
    klass: "crypto",
    geckoId: "ripple",
    quote: "USD",
  },
  {
    id: "spy",
    symbol: "SPY",
    name: "S&P 500 ETF",
    klass: "etf",
    yahoo: "SPY",
    quote: "USD",
    tutorial: "Koš 500 největších amerických firem. Základ dlouhodobého portfolia.",
  },
  {
    id: "qqq",
    symbol: "QQQ",
    name: "Nasdaq-100 ETF",
    klass: "etf",
    yahoo: "QQQ",
    quote: "USD",
  },
  {
    id: "aapl",
    symbol: "AAPL",
    name: "Apple",
    klass: "stock",
    yahoo: "AAPL",
    quote: "USD",
  },
  {
    id: "nvda",
    symbol: "NVDA",
    name: "NVIDIA",
    klass: "stock",
    yahoo: "NVDA",
    quote: "USD",
  },
  {
    id: "msft",
    symbol: "MSFT",
    name: "Microsoft",
    klass: "stock",
    yahoo: "MSFT",
    quote: "USD",
  },
  {
    id: "cez",
    symbol: "CEZ",
    name: "ČEZ",
    klass: "stock",
    yahoo: "CEZ.PR",
    quote: "CZK",
    tutorial: "Česká energetika, obchodovaná na BCPP v korunách — bez FX spreadu.",
  },
  {
    id: "kb",
    symbol: "KOMB",
    name: "Komerční banka",
    klass: "stock",
    yahoo: "KOMB.PR",
    quote: "CZK",
  },
  {
    id: "gold",
    symbol: "GLD",
    name: "Zlato ETF",
    klass: "etf",
    yahoo: "GLD",
    quote: "USD",
  },
];

export function getInstrument(id: string) {
  return INSTRUMENTS.find((i) => i.id === id);
}
