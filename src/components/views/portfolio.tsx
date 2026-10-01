import { getInstrument } from "@/lib/instruments";
import { formatCzk, formatPct, formatQty } from "@/lib/format";
import { yearsHeld } from "@/lib/tax-cz";
import { useGame } from "@/store/game-store";
import { Button } from "@/components/ui/button";

export function Portfolio() {
  const game = useGame((s) => s.game)!;
  const markets = useGame((s) => s.markets);
  const sell = useGame((s) => s.sell);
  const fx = useGame((s) => s.fx);

  if (!markets) return <p className="text-muted">Načítám…</p>;

  return (
    <div className="grid gap-6">
      <section className="grid gap-3 sm:grid-cols-3">
        <Cash k="CZK" v={formatCzk(game.cashCzk, true)} />
        <Cash k="USD" v={game.cashUsd.toFixed(2) + " $"} />
        <Cash k="EUR" v={game.cashEur.toFixed(2) + " €"} />
      </section>

      <section className="rounded-lg border border-line bg-surface p-4">
        <p className="text-xs text-muted">Směna měn · spread 0,5 %</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="quiet"
            onClick={() => fx("CZK", "USD", Math.min(5000, game.cashCzk))}
          >
            5 000 Kč → USD
          </Button>
          <Button
            size="sm"
            variant="quiet"
            onClick={() => fx("USD", "CZK", game.cashUsd)}
            disabled={game.cashUsd <= 0}
          >
            USD → CZK
          </Button>
          <Button
            size="sm"
            variant="quiet"
            onClick={() => fx("CZK", "EUR", Math.min(5000, game.cashCzk))}
          >
            5 000 Kč → EUR
          </Button>
        </div>
      </section>

      <section className="overflow-x-auto rounded-lg border border-line bg-surface">
        {game.lots.length === 0 ? (
          <p className="p-6 text-sm text-muted">Zatím nemáš žádné pozice. Otevři Trhy a kup Bitcoin nebo ETF.</p>
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-xs text-muted">
              <tr className="border-b border-line">
                <th className="px-4 py-3 text-left font-medium">Pozice</th>
                <th className="px-4 py-3 text-left font-medium">Množství</th>
                <th className="px-4 py-3 text-left font-medium">Hodnota</th>
                <th className="px-4 py-3 text-left font-medium">Zisk</th>
                <th className="px-4 py-3 text-left font-medium">Držba</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {game.lots.map((lot) => {
                const inst = getInstrument(lot.instrumentId);
                const q = markets.quotes[lot.instrumentId];
                const value = q ? q.priceCzk * lot.qty : 0;
                const pnl = value - lot.costCzk;
                const pct = lot.costCzk ? (pnl / lot.costCzk) * 100 : 0;
                const yrs = yearsHeld(lot.boughtAt, Date.now());
                return (
                  <tr key={lot.id} className="border-b border-line/70">
                    <td className="px-4 py-3">
                      <div className="font-medium">{inst?.symbol}</div>
                      <div className="text-xs text-muted">{inst?.name}</div>
                    </td>
                    <td className="tabular px-4 py-3">{formatQty(lot.qty)}</td>
                    <td className="tabular px-4 py-3">{formatCzk(value)}</td>
                    <td className={`tabular px-4 py-3 ${pnl >= 0 ? "text-up" : "text-down"}`}>
                      {formatCzk(pnl)} ({formatPct(pct)})
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {yrs.toFixed(2)} r. {yrs >= 3 ? "· osvobozeno" : ""}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => sell(lot.id, 1)}>
                        Prodat
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function Cash({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <p className="text-xs text-muted">{k}</p>
      <p className="tabular mt-1 text-lg">{v}</p>
    </div>
  );
}
