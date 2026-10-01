import type { CityId } from "./cities";
import type { AssetClass } from "./instruments";

export type TabId =
  | "overview"
  | "markets"
  | "portfolio"
  | "property"
  | "life"
  | "learn";

export type Lot = {
  id: string;
  instrumentId: string;
  klass: AssetClass;
  qty: number;
  costCzk: number;
  boughtAt: string;
};

export type Property = {
  id: string;
  cityId: CityId;
  label: string;
  m2: number;
  rooms: "1kk" | "2kk";
  purchasePrice: number;
  boughtAt: string;
  rented: boolean;
  monthlyRent: number;
};

export type Loan = {
  id: string;
  kind: "mortgage" | "consumer";
  principal: number;
  remaining: number;
  rate: number;
  monthly: number;
  monthsLeft: number;
  propertyId?: string;
};

export type LedgerEntry = {
  id: string;
  at: string;
  kind: "income" | "expense" | "trade" | "tax" | "loan" | "event";
  label: string;
  amount: number;
};

export type NewsItem = {
  id: string;
  at: string;
  title: string;
  body: string;
};

export type GameState = {
  version: 1;
  name: string;
  cityId: CityId;
  startedAt: string;
  lastTick: string;
  cashCzk: number;
  cashUsd: number;
  cashEur: number;
  employed: boolean;
  lots: Lot[];
  properties: Property[];
  loans: Loan[];
  ledger: LedgerEntry[];
  news: NewsItem[];
  tutorialStep: number;
  ytd: {
    year: number;
    wage: number;
    cryptoProceeds: number;
    taxableGains: number;
    taxPaid: number;
  };
  netWorthHistory: { t: number; v: number }[];
  bankrupt: boolean;
  housing: { mode: "rent"; rooms: "1kk" | "2kk" } | { mode: "own"; propertyId: string };
};

export type Quote = {
  id: string;
  priceUsd?: number;
  priceCzk: number;
  change24: number;
};

export type MarketSnapshot = {
  fetchedAt: number;
  usdCzk: number;
  eurCzk: number;
  quotes: Record<string, Quote>;
  source: "live" | "fallback";
};
