import { formatCzk, formatPct } from "@/lib/format";
import { getCity } from "@/lib/cities";
import {
  liquidCashCzk,
  monthlyIncome,
  monthlyOutgoings,
  netWorth,
  portfolioValueCzk,
  propertyEquity,
} from "@/lib/game-engine";
import { payrollFromGross } from "@/lib/tax-cz";
import { useGame } from "@/store/game-store";
import { Button } from "@/components/ui/button";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function Overview() {
  const game = useGame((s) => s.game)!;
  const markets = useGame((s) => s.markets);
  const waitDays = useGame((s) => s.waitDays);
  const city = getCity(game.cityId);
  const pay = payrollFromGross(city.grossMonthly);

  if (!markets) {
    return <p className="text-muted">Načítám živé trhy…</p>;
  }

  const cards = [
    { k: "Hotovost", v: formatCzk(liquidCashCzk(game, markets)) },
    { k: "Portfolio", v: formatCzk(portfolioValueCzk(game, markets)) },
    { k: "Nemovitosti (equity)", v: formatCzk(propertyEquity(game)) },
    { k: "Čisté jmění", v: formatCzk(netWorth(game, markets)) },
  ];

  const cashflow = monthlyIncome(game) - monthlyOutgoings(game);
  const data = game.netWorthHistory.map((p) => ({
    t: new Date(p.t).toLocaleDateString("cs-CZ"),
    v: p.v,
  }));

  return (
    <div className="grid gap-6">
      {game.bankrupt ? (
        <div className="rounded-lg border border-danger/40 bg-raised p-4">
          <p className="font-medium text-danger">Osobní bankrot</p>
          <p className="mt-1 text-sm text-muted">
            Dluhy převýšily majetek. Můžeš začít znovu v záložce Život.
          </p>
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <article key={c.k} className="rounded-lg border border-line bg-surface p-4">
            <p className="text-xs text-muted">{c.k}</p>
            <p className="tabular mt-1 text-lg font-medium">{c.v}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-lg border border-line bg-surface p-4 lg:col-span-2">
          <p className="text-xs text-muted">Vývoj čistého jmění</p>
          <div className="mt-3 h-48">
            {data.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <XAxis dataKey="t" hide />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: "#141c1a",
                      border: "1px solid #2a3531",
                      borderRadius: 8,
                    }}
                    formatter={(v) => formatCzk(Number(v))}
                  />
                  <Area type="monotone" dataKey="v" stroke="#c8f542" fill="#c8f54222" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted">Graf se objeví po prvních dnech života.</p>
            )}
          </div>
        </article>

        <article className="rounded-lg border border-line bg-surface p-4">
          <p className="text-xs text-muted">Měsíční cashflow</p>
          <p className={`tabular mt-1 text-2xl font-medium ${cashflow >= 0 ? "text-up" : "text-down"}`}>
            {formatCzk(cashflow)}
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex justify-between">
              <span className="text-muted">Netto mzda</span>
              <span className="tabular">{game.employed ? formatCzk(pay.net) : "0"}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted">Výdaje</span>
              <span className="tabular">{formatCzk(monthlyOutgoings(game))}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted">USD / CZK</span>
              <span className="tabular">{markets.usdCzk.toFixed(3)}</span>
            </li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="quiet" onClick={() => waitDays(7)}>
              +7 dní
            </Button>
            <Button size="sm" variant="quiet" onClick={() => waitDays(30)}>
              +30 dní
            </Button>
          </div>
          <p className="mt-2 text-xs text-faint">
            Ceny trhů zůstávají živé. Posun času řeší výplatu, nájem a splátky.
          </p>
        </article>
      </section>

      <section className="rounded-lg border border-line bg-surface p-4">
        <p className="text-xs text-muted">Zprávy a deník</p>
        <ul className="mt-3 divide-y divide-line">
          {game.news.slice(0, 4).map((n) => (
            <li key={n.id} className="py-3">
              <p className="text-sm font-medium">{n.title}</p>
              <p className="text-sm text-muted">{n.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {markets.quotes.btc ? (
        <p className="text-xs text-faint">
          BTC {formatCzk(markets.quotes.btc.priceCzk, true)} · 24h{" "}
          {formatPct(markets.quotes.btc.change24)}
        </p>
      ) : null}
    </div>
  );
}
