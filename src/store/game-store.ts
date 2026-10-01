import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CityId } from "@/lib/cities";
import type { GameState, MarketSnapshot, TabId } from "@/lib/game-types";
import {
  applyElapsed,
  buyAsset,
  buyProperty,
  convertFx,
  createNewGame,
  quitJob,
  resetBankruptcy,
  sellLot,
  skipDays,
  takeConsumerLoan,
} from "@/lib/game-engine";

type GameStore = {
  game: GameState | null;
  tab: TabId;
  markets: MarketSnapshot | null;
  marketsError: string | null;
  busy: boolean;
  toast: string | null;
  setTab: (t: TabId) => void;
  setMarkets: (m: MarketSnapshot) => void;
  setMarketsError: (e: string | null) => void;
  start: (cityId: CityId, name: string) => void;
  reset: () => void;
  tick: () => void;
  buy: (instrumentId: string, spendCzk: number) => void;
  sell: (lotId: string, fraction?: number) => void;
  fx: (from: "CZK" | "USD" | "EUR", to: "CZK" | "USD" | "EUR", amount: number) => void;
  loan: (amount: number) => void;
  purchaseHome: (cityId: CityId, rooms: "1kk" | "2kk", mortgage: boolean) => void;
  leaveJob: () => void;
  waitDays: (days: number) => void;
  advanceTutorial: (n: number) => void;
  clearToast: () => void;
};

function mutate(game: GameState, fn: (g: GameState) => void) {
  const clone = structuredClone(game);
  fn(clone);
  return clone;
}

export const useGame = create<GameStore>()(
  persist(
    (set, get) => ({
      game: null,
      tab: "overview",
      markets: null,
      marketsError: null,
      busy: false,
      toast: null,
      setTab: (tab) => set({ tab }),
      setMarkets: (markets) => set({ markets, marketsError: null }),
      setMarketsError: (marketsError) => set({ marketsError }),
      start: (cityId, name) =>
        set({ game: createNewGame(cityId, name), tab: "overview", toast: "Nový život spuštěn." }),
      reset: () => {
        const g = get().game;
        set({ game: g ? resetBankruptcy(g) : null, toast: "Nový začátek." });
      },
      tick: () => {
        const { game, markets } = get();
        if (!game || !markets) return;
        set({ game: mutate(game, (g) => applyElapsed(g, markets)) });
      },
      buy: (instrumentId, spendCzk) => {
        const { game, markets } = get();
        if (!game || !markets) return;
        try {
          set({
            game: mutate(game, (g) => buyAsset(g, markets, instrumentId, spendCzk)),
            toast: "Nákup proveden.",
          });
        } catch (e) {
          set({ toast: e instanceof Error ? e.message : "Nákup selhal." });
        }
      },
      sell: (lotId, fraction) => {
        const { game, markets } = get();
        if (!game || !markets) return;
        try {
          set({
            game: mutate(game, (g) => sellLot(g, markets, lotId, fraction)),
            toast: "Prodej proveden.",
          });
        } catch (e) {
          set({ toast: e instanceof Error ? e.message : "Prodej selhal." });
        }
      },
      fx: (from, to, amount) => {
        const { game, markets } = get();
        if (!game || !markets) return;
        try {
          set({
            game: mutate(game, (g) => convertFx(g, markets, from, to, amount)),
            toast: "Směna hotova.",
          });
        } catch (e) {
          set({ toast: e instanceof Error ? e.message : "Směna selhala." });
        }
      },
      loan: (amount) => {
        const { game } = get();
        if (!game) return;
        try {
          set({
            game: mutate(game, (g) => takeConsumerLoan(g, amount)),
            toast: "Úvěr načerpán.",
          });
        } catch (e) {
          set({ toast: e instanceof Error ? e.message : "Úvěr selhal." });
        }
      },
      purchaseHome: (cityId, rooms, mortgage) => {
        const { game } = get();
        if (!game) return;
        try {
          set({
            game: mutate(game, (g) => buyProperty(g, cityId, rooms, mortgage)),
            toast: "Nemovitost zapsána.",
          });
        } catch (e) {
          set({ toast: e instanceof Error ? e.message : "Koupě bytu selhala." });
        }
      },
      leaveJob: () => {
        const { game } = get();
        if (!game) return;
        set({ game: mutate(game, quitJob), toast: "Už nejsi zaměstnaný." });
      },
      waitDays: (days) => {
        const { game, markets } = get();
        if (!game || !markets) return;
        set({ game: mutate(game, (g) => skipDays(g, markets, days)) });
      },
      advanceTutorial: (n) => {
        const { game } = get();
        if (!game) return;
        set({ game: mutate(game, (g) => { g.tutorialStep = Math.max(g.tutorialStep, n); }) });
      },
      clearToast: () => set({ toast: null }),
    }),
    {
      name: "kapital-cz-v1",
      partialize: (s) => ({ game: s.game, tab: s.tab }),
    },
  ),
);
