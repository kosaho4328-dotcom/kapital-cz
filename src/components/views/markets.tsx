import { useState } from "react";
import { INSTRUMENTS } from "@/lib/instruments";
import { formatCzk, formatPct, formatUsd } from "@/lib/format";
import { useGame } from "@/store/game-store";
import { Button } from "@/components/ui/button";

export function Markets() {
  const markets = useGame((s) => s.markets);
  const game = useGame((s) => s.game)!;
  const buy = useGame((s) => s.buy);
  const [id, setId] = useState("btc");
  const [amount, setAmount] = useState("5000");
  const inst = INSTRUMENTS.find((i) => i.id === id)!;
  const quote = markets?.quotes[id];

  if (!markets) return <p className="text-muted">Načítám kotace…</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="text-xs text-muted">
            <tr className="border-b border-line">
              <th className="px-4 py-3 font-medium">Instrument</th>
              <th className="px-4 py-3 font-medium">Třída</th>
              <th className="px-4 py-3 font-medium">Cena</th>
              <th className="px-4 py-3 font-medium">24h</th>
            </tr>
          </thead>
          <tbody>
            {INSTRUMENTS.map((row) => {
              const q = markets.quotes[row.id];
              const on = row.id === id;
              return (
                <tr
                  key={row.id}
                  className={`cursor-pointer border-b border-line/70 ${on ? "bg-raised" : "hover:bg-raised/60"}`}
                  onClick={() => setId(row.id)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{row.symbol}</div>
                    <div className="text-xs text-muted">{row.name}</div>
                  </td>
                  <td className="px-4 py-3 text-muted">{row.klass}</td>
                  <td className="tabular px-4 py-3">
                    {q ? formatCzk(q.priceCzk, true) : "—"}
                    {q?.priceUsd ? (
                      <div className="text-xs text-muted">{formatUsd(q.priceUsd)}</div>
                    ) : null}
                  </td>
                  <td
                    className={`tabular px-4 py-3 ${
                      (q?.change24 ?? 0) >= 0 ? "text-up" : "text-down"
                    }`}
                  >
                    {q ? formatPct(q.change24) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <aside className="h-fit rounded-lg border border-line bg-surface p-4">
        <p className="text-xs text-muted">Obchodovat</p>
        <h2 className="mt-1 text-xl font-medium">
          {inst.symbol} <span className="text-muted text-sm">{inst.name}</span>
        </h2>
        <p className="mt-2 tabular text-2xl">
          {quote ? formatCzk(quote.priceCzk, true) : "—"}
        </p>
        {inst.tutorial ? <p className="mt-3 text-sm text-muted">{inst.tutorial}</p> : null}

        <label className="mt-5 grid gap-1 text-sm">
          <span className="text-muted">Částka v Kč</span>
          <input
            type="number"
            min={500}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-11 rounded-md border border-line bg-bg px-3 tabular outline-none focus:border-primary"
          />
        </label>
        <p className="mt-2 text-xs text-faint">
          Hotovost CZK: {formatCzk(game.cashCzk)} · komise 0 % · FX u USD instrumentů je v ceně CZK
        </p>
        <Button
          className="mt-4 w-full"
          onClick={() => buy(id, Number(amount))}
          disabled={game.bankrupt}
        >
          Koupit {inst.symbol}
        </Button>
      </aside>
    </div>
  );
}
