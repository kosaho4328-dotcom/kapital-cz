import { getCity, type CityId } from "./cities";
import { INSTRUMENTS, getInstrument } from "./instruments";
import {
  FX_SPREAD,
  MORTGAGE_RATE,
  MAINTENANCE_RATE,
  PROPERTY_TAX_RATE,
  isTimeTestExempt,
  mortgagePayment,
  payrollFromGross,
} from "./tax-cz";
import type { GameState, LedgerEntry, Lot, MarketSnapshot, NewsItem, Property } from "./game-types";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function nowIso(d = new Date()) {
  return d.toISOString();
}

function pushLedger(state: GameState, entry: Omit<LedgerEntry, "id">) {
  state.ledger.unshift({ id: uid(), ...entry });
  state.ledger = state.ledger.slice(0, 200);
}

function pushNews(state: GameState, item: Omit<NewsItem, "id" | "at">) {
  state.news.unshift({ id: uid(), at: nowIso(), ...item });
  state.news = state.news.slice(0, 40);
}

export function createNewGame(cityId: CityId, name: string): GameState {
  const city = getCity(cityId);
  const started = nowIso();
  const year = new Date().getFullYear();
  return {
    version: 1,
    name: name.trim() || "Investor",
    cityId,
    startedAt: started,
    lastTick: started,
    cashCzk: 30_000,
    cashUsd: 0,
    cashEur: 0,
    employed: true,
    lots: [],
    properties: [],
    loans: [],
    ledger: [
      {
        id: uid(),
        at: started,
        kind: "event",
        label: "Startovní úspory",
        amount: 30_000,
      },
    ],
    news: [
      {
        id: uid(),
        at: started,
        title: "Vítej v Kapitalu",
        body: `Žiješ v ${city.name}, pracuješ jako ${city.jobTitle}. Ceny na trzích jsou živé. Plat dostáváš 15. každého měsíce.`,
      },
    ],
    tutorialStep: 0,
    ytd: { year, wage: 0, cryptoProceeds: 0, taxableGains: 0, taxPaid: 0 },
    netWorthHistory: [],
    bankrupt: false,
    housing: { mode: "rent", rooms: "1kk" },
  };
}

export function liquidCashCzk(state: GameState, snap: MarketSnapshot) {
  return state.cashCzk + state.cashUsd * snap.usdCzk + state.cashEur * snap.eurCzk;
}

export function portfolioValueCzk(state: GameState, snap: MarketSnapshot) {
  return state.lots.reduce((sum, lot) => {
    const q = snap.quotes[lot.instrumentId];
    return sum + (q ? q.priceCzk * lot.qty : 0);
  }, 0);
}

export function propertyEquity(state: GameState) {
  const loanOn = (p: Property) =>
    state.loans
      .filter((l) => l.propertyId === p.id)
      .reduce((s, l) => s + l.remaining, 0);
  return state.properties.reduce((s, p) => s + p.purchasePrice - loanOn(p), 0);
}

export function netWorth(state: GameState, snap: MarketSnapshot) {
  const otherLoans = state.loans
    .filter((l) => !l.propertyId)
    .reduce((s, l) => s + l.remaining, 0);
  return (
    liquidCashCzk(state, snap) +
    portfolioValueCzk(state, snap) +
    propertyEquity(state) -
    otherLoans
  );
}

export function monthlyHousingCost(state: GameState) {
  const city = getCity(state.cityId);
  if (state.housing.mode === "rent") {
    return state.housing.rooms === "2kk" ? city.rent2kk : city.rent1kk;
  }
  return 0;
}

export function monthlyOutgoings(state: GameState) {
  const city = getCity(state.cityId);
  const loans = state.loans.reduce((s, l) => s + l.monthly, 0);
  const maint = state.properties.reduce((s, p) => s + (p.purchasePrice * MAINTENANCE_RATE) / 12, 0);
  const tax = state.properties.reduce((s, p) => s + (p.purchasePrice * PROPERTY_TAX_RATE) / 12, 0);
  return city.livingCost + (state.employed ? 0 : 4500) + monthlyHousingCost(state) + loans + maint + tax;
}

export function monthlyIncome(state: GameState) {
  const city = getCity(state.cityId);
  const wage = state.employed ? payrollFromGross(city.grossMonthly).net : 0;
  const rentIn = state.properties.reduce((s, p) => s + (p.rented ? p.monthlyRent : 0), 0);
  return wage + rentIn;
}

function ensureYear(state: GameState, d: Date) {
  if (state.ytd.year !== d.getFullYear()) {
    state.ytd = {
      year: d.getFullYear(),
      wage: 0,
      cryptoProceeds: 0,
      taxableGains: 0,
      taxPaid: 0,
    };
  }
}

export function applyElapsed(state: GameState, snap: MarketSnapshot, until = new Date()) {
  if (state.bankrupt) return state;
  const from = new Date(state.lastTick);
  if (until.getTime() <= from.getTime()) {
    recordNetWorth(state, snap, until);
    return state;
  }

  const cursor = new Date(from);
  cursor.setDate(1);
  cursor.setHours(12, 0, 0, 0);
  if (cursor <= from) cursor.setMonth(cursor.getMonth() + 1);

  while (cursor <= until) {
    runMonth(state, snap, new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  state.lastTick = until.toISOString();
  recordNetWorth(state, snap, until);
  maybeBankrupt(state, snap);
  return state;
}

function runMonth(state: GameState, _snap: MarketSnapshot, when: Date) {
  ensureYear(state, when);
  const city = getCity(state.cityId);
  const at = when.toISOString();

  if (state.employed) {
    const pay = payrollFromGross(city.grossMonthly);
    state.cashCzk += pay.net;
    state.ytd.wage += pay.gross;
    pushLedger(state, {
      at,
      kind: "income",
      label: `Výplata — ${city.jobTitle} (netto)`,
      amount: pay.net,
    });
  }

  const rentIn = state.properties.reduce((s, p) => s + (p.rented ? p.monthlyRent : 0), 0);
  if (rentIn > 0) {
    state.cashCzk += rentIn;
    pushLedger(state, { at, kind: "income", label: "Nájem od nájemníků", amount: rentIn });
  }

  const housing = monthlyHousingCost(state);
  const living = city.livingCost + (state.employed ? 0 : 4500);
  const maint = state.properties.reduce((s, p) => s + (p.purchasePrice * MAINTENANCE_RATE) / 12, 0);
  const ptax = state.properties.reduce((s, p) => s + (p.purchasePrice * PROPERTY_TAX_RATE) / 12, 0);

  debit(state, housing, at, "Nájem za bydlení");
  debit(state, living, at, "Životní náklady (jídlo, doprava, energie)");
  if (maint > 10) debit(state, Math.round(maint), at, "Údržba nemovitostí");
  if (ptax > 10) debit(state, Math.round(ptax), at, "Daň z nemovitosti (měsíční záloha)");

  for (const loan of state.loans) {
    if (loan.monthsLeft <= 0) continue;
    const interest = loan.remaining * (loan.rate / 12);
    const principalPay = Math.min(loan.remaining, loan.monthly - interest);
    debit(state, Math.round(loan.monthly), at, `Splátka ${loan.kind === "mortgage" ? "hypotéky" : "úvěru"}`);
    loan.remaining = Math.max(0, loan.remaining - principalPay);
    loan.monthsLeft -= 1;
  }
  state.loans = state.loans.filter((l) => l.remaining > 1);

  if (when.getMonth() === 0) {
    pushNews(state, {
      title: `Daňové přiznání ${when.getFullYear() - 1}`,
      body: "Zkontroluj kapitálové zisky. Krypto po 3 letech držby je osvobozené; u kratších prodejů platí 15 % ze zisku, pokud příjmy překročí 100 000 Kč.",
    });
  }
}

function debit(state: GameState, amount: number, at: string, label: string) {
  const n = Math.round(amount);
  if (n <= 0) return;
  state.cashCzk -= n;
  pushLedger(state, { at, kind: "expense", label, amount: -n });
}

function recordNetWorth(state: GameState, snap: MarketSnapshot, when: Date) {
  const v = Math.round(netWorth(state, snap));
  const last = state.netWorthHistory[state.netWorthHistory.length - 1];
  if (!last || when.getTime() - last.t > 60 * 60 * 1000) {
    state.netWorthHistory.push({ t: when.getTime(), v });
    state.netWorthHistory = state.netWorthHistory.slice(-180);
  }
}

function maybeBankrupt(state: GameState, snap: MarketSnapshot) {
  const nw = netWorth(state, snap);
  if (state.cashCzk < -50_000 && nw < 0) {
    state.bankrupt = true;
    pushNews(state, {
      title: "Osobní bankrot",
      body: "Hotovost i čisté jmění jsou záporné. Můžeš začít znovu, nebo se pokusit o restrukturalizaci prodejem aktiv.",
    });
  }
}

export function convertFx(
  state: GameState,
  snap: MarketSnapshot,
  from: "CZK" | "USD" | "EUR",
  to: "CZK" | "USD" | "EUR",
  amount: number,
) {
  if (amount <= 0) throw new Error("Částka musí být kladná.");
  const rates: Record<string, number> = { CZK: 1, USD: snap.usdCzk, EUR: snap.eurCzk };
  const fromBal = from === "CZK" ? state.cashCzk : from === "USD" ? state.cashUsd : state.cashEur;
  if (amount > fromBal + 1e-8) throw new Error("Nedostatek prostředků v této měně.");
  const czkValue = amount * rates[from];
  const received = (czkValue / rates[to]) * (1 - FX_SPREAD);
  if (from === "CZK") state.cashCzk -= amount;
  if (from === "USD") state.cashUsd -= amount;
  if (from === "EUR") state.cashEur -= amount;
  if (to === "CZK") state.cashCzk += received;
  if (to === "USD") state.cashUsd += received;
  if (to === "EUR") state.cashEur += received;
  pushLedger(state, {
    at: nowIso(),
    kind: "trade",
    label: `Směna ${from} → ${to} (spread 0,5 %)`,
    amount: to === "CZK" ? received : -czkValue * FX_SPREAD,
  });
}

export function buyAsset(
  state: GameState,
  snap: MarketSnapshot,
  instrumentId: string,
  spendCzk: number,
) {
  if (state.bankrupt) throw new Error("Účet je v bankrotu.");
  if (spendCzk < 500) throw new Error("Minimální nákup je 500 Kč.");
  if (state.cashCzk < spendCzk) throw new Error("Nedostatek korun na účtu.");
  const inst = getInstrument(instrumentId);
  const quote = snap.quotes[instrumentId];
  if (!inst || !quote) throw new Error("Neznámý instrument.");
  const qty = spendCzk / quote.priceCzk;
  state.cashCzk -= spendCzk;
  state.lots.push({
    id: uid(),
    instrumentId,
    klass: inst.klass,
    qty,
    costCzk: spendCzk,
    boughtAt: nowIso(),
  });
  pushLedger(state, {
    at: nowIso(),
    kind: "trade",
    label: `Nákup ${inst.symbol}`,
    amount: -spendCzk,
  });
  if (state.tutorialStep < 3) state.tutorialStep = 3;
}

export function sellLot(state: GameState, snap: MarketSnapshot, lotId: string, fraction = 1) {
  const lot = state.lots.find((l) => l.id === lotId);
  if (!lot) throw new Error("Pozice nenalezena.");
  const inst = getInstrument(lot.instrumentId);
  const quote = snap.quotes[lot.instrumentId];
  if (!inst || !quote) throw new Error("Chybí cena.");
  const f = Math.min(1, Math.max(0.01, fraction));
  const qty = lot.qty * f;
  const proceeds = qty * quote.priceCzk;
  const cost = lot.costCzk * f;
  const gain = proceeds - cost;
  const now = Date.now();
  const exemptTime = isTimeTestExempt(lot.boughtAt, now);
  if (inst.klass === "crypto") {
    state.ytd.cryptoProceeds += proceeds;
    if (!exemptTime && state.ytd.cryptoProceeds > 100_000 && gain > 0) {
      state.ytd.taxableGains += gain;
    }
  } else if (!exemptTime && gain > 0) {
    state.ytd.taxableGains += gain;
  }
  state.cashCzk += proceeds;
  if (f >= 0.999) {
    state.lots = state.lots.filter((l) => l.id !== lotId);
  } else {
    lot.qty -= qty;
    lot.costCzk -= cost;
  }
  pushLedger(state, {
    at: nowIso(),
    kind: "trade",
    label: `Prodej ${inst.symbol}${exemptTime ? " (časový test splněn)" : ""}`,
    amount: proceeds,
  });
}

export function takeConsumerLoan(state: GameState, amount: number) {
  if (amount < 10_000 || amount > 250_000) throw new Error("Spotřebák 10–250 tis. Kč.");
  const rate = 0.129;
  const years = 5;
  const monthly = mortgagePayment(amount, rate, years);
  state.cashCzk += amount;
  state.loans.push({
    id: uid(),
    kind: "consumer",
    principal: amount,
    remaining: amount,
    rate,
    monthly,
    monthsLeft: years * 12,
  });
  pushLedger(state, {
    at: nowIso(),
    kind: "loan",
    label: "Čerpání spotřebitelského úvěru",
    amount,
  });
}

export function buyProperty(
  state: GameState,
  cityId: CityId,
  rooms: "1kk" | "2kk",
  withMortgage: boolean,
) {
  const city = getCity(cityId);
  const m2 = rooms === "1kk" ? 32 : 55;
  const price = Math.round(city.pricePerM2 * m2);
  const down = withMortgage ? Math.round(price * 0.2) : price;
  if (state.cashCzk < down) throw new Error("Nemáš dostatek na akontaci / kupní cenu.");
  const id = uid();
  const monthlyRent = rooms === "1kk" ? Math.round(city.rent1kk * 0.95) : Math.round(city.rent2kk * 0.95);
  const prop: Property = {
    id,
    cityId,
    label: `${rooms} · ${m2} m² · ${city.name}`,
    m2,
    rooms,
    purchasePrice: price,
    boughtAt: nowIso(),
    rented: state.housing.mode === "own" || state.housing.mode === "rent",
    monthlyRent,
  };
  if (state.housing.mode === "rent") {
    prop.rented = false;
    state.housing = { mode: "own", propertyId: id };
  } else {
    prop.rented = true;
  }
  state.cashCzk -= down;
  state.properties.push(prop);
  if (withMortgage) {
    const principal = price - down;
    const monthly = mortgagePayment(principal, MORTGAGE_RATE, 30);
    state.loans.push({
      id: uid(),
      kind: "mortgage",
      principal,
      remaining: principal,
      rate: MORTGAGE_RATE,
      monthly,
      monthsLeft: 360,
      propertyId: id,
    });
  }
  pushLedger(state, {
    at: nowIso(),
    kind: "event",
    label: `Koupě ${prop.label}`,
    amount: -down,
  });
}

export function quitJob(state: GameState) {
  if (!state.employed) return;
  state.employed = false;
  pushNews(state, {
    title: "Výpověď podána",
    body: "Od teď žiješ z portfolia, pronájmů a úspor. Sociální a zdravotní si musíš hradit sám — v této verzi je to zahrnuto ve vyšších životních nákladech +4 500 Kč.",
  });
  pushLedger(state, {
    at: nowIso(),
    kind: "event",
    label: "Ukončení zaměstnání",
    amount: 0,
  });
}

export function skipDays(state: GameState, snap: MarketSnapshot, days: number) {
  const until = new Date(state.lastTick);
  until.setDate(until.getDate() + days);
  applyElapsed(state, snap, until);
}

export function resetBankruptcy(state: GameState): GameState {
  return createNewGame(state.cityId, state.name);
}

export { INSTRUMENTS };
