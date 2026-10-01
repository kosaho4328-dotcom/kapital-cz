import { useEffect } from "react";
import {
  BookOpen,
  Briefcase,
  LayoutDashboard,
  LineChart,
  Landmark,
  Wallet,
} from "lucide-react";
import { getMarkets } from "@/lib/markets-api";
import { formatCzk } from "@/lib/format";
import { getCity } from "@/lib/cities";
import { netWorth } from "@/lib/game-engine";
import { payrollFromGross } from "@/lib/tax-cz";
import { useGame } from "@/store/game-store";
import type { TabId } from "@/lib/game-types";
import { Overview } from "@/components/views/overview";
import { Markets } from "@/components/views/markets";
import { Portfolio } from "@/components/views/portfolio";
import { PropertyView } from "@/components/views/property";
import { LifeView } from "@/components/views/life";
import { LearnView } from "@/components/views/learn";

const TABS: { id: TabId; label: string; icon: typeof Wallet }[] = [
  { id: "overview", label: "Přehled", icon: LayoutDashboard },
  { id: "markets", label: "Trhy", icon: LineChart },
  { id: "portfolio", label: "Portfolio", icon: Wallet },
  { id: "property", label: "Byty", icon: Landmark },
  { id: "life", label: "Život", icon: Briefcase },
  { id: "learn", label: "Výuka", icon: BookOpen },
];

export function AppShell() {
  const game = useGame((s) => s.game)!;
  const tab = useGame((s) => s.tab);
  const setTab = useGame((s) => s.setTab);
  const markets = useGame((s) => s.markets);
  const setMarkets = useGame((s) => s.setMarkets);
  const setMarketsError = useGame((s) => s.setMarketsError);
  const tick = useGame((s) => s.tick);
  const toast = useGame((s) => s.toast);
  const clearToast = useGame((s) => s.clearToast);

  useEffect(() => {
    let live = true;
    const load = async () => {
      try {
        const snap = await getMarkets();
        if (live) setMarkets(snap);
      } catch (e) {
        if (live) setMarketsError(e instanceof Error ? e.message : "Trhy nedostupné");
      }
    };
    load();
    const id = setInterval(load, 60_000);
    return () => {
      live = false;
      clearInterval(id);
    };
  }, [setMarkets, setMarketsError]);

  useEffect(() => {
    if (markets) tick();
  }, [markets, tick]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 2800);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  const city = getCity(game.cityId);
  const nw = markets ? netWorth(game, markets) : game.cashCzk;

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-[11px] tracking-[0.22em] text-primary uppercase">Kapital</p>
            <p className="text-sm text-muted">
              {game.name} · {city.name}
              {markets ? (
                <span className="ml-2 text-faint">
                  {markets.source === "live" ? "živá data" : "záložní kurzy"}
                </span>
              ) : (
                <span className="ml-2 text-faint">načítám trhy…</span>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted">Čisté jmění</p>
            <p className="tabular text-lg font-medium">{formatCzk(nw)}</p>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 pb-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex min-h-11 shrink-0 items-center gap-2 rounded-md px-3 text-sm ${
                  on ? "bg-raised text-fg" : "text-muted hover:text-fg"
                }`}
              >
                <Icon className="size-4" />
                {t.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 pb-24">
        {tab === "overview" && <Overview />}
        {tab === "markets" && <Markets />}
        {tab === "portfolio" && <Portfolio />}
        {tab === "property" && <PropertyView />}
        {tab === "life" && <LifeView />}
        {tab === "learn" && <LearnView />}
      </main>

      {toast ? (
        <div className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-md bg-raised px-4 py-2 text-sm shadow-lg">
          {toast}
        </div>
      ) : null}

      <p className="sr-only">
        {city.jobTitle} {payrollFromGross(city.grossMonthly).net}
      </p>
    </div>
  );
}
