import { getCity } from "@/lib/cities";
import { formatCzk, formatDate } from "@/lib/format";
import { payrollFromGross } from "@/lib/tax-cz";
import { monthlyOutgoings } from "@/lib/game-engine";
import { useGame } from "@/store/game-store";
import { Button } from "@/components/ui/button";

export function LifeView() {
  const game = useGame((s) => s.game)!;
  const leaveJob = useGame((s) => s.leaveJob);
  const loan = useGame((s) => s.loan);
  const reset = useGame((s) => s.reset);
  const waitDays = useGame((s) => s.waitDays);
  const city = getCity(game.cityId);
  const pay = payrollFromGross(city.grossMonthly);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-lg border border-line bg-surface p-4">
        <p className="text-xs text-muted">Zaměstnání</p>
        <h2 className="mt-1 text-xl font-medium">{city.jobTitle}</h2>
        <ul className="mt-4 space-y-2 text-sm">
          <li className="flex justify-between">
            <span className="text-muted">Hrubá mzda</span>
            <span className="tabular">{formatCzk(city.grossMonthly)}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-muted">Sociální 6,5 %</span>
            <span className="tabular">{formatCzk(pay.social)}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-muted">Zdravotní 4,5 %</span>
            <span className="tabular">{formatCzk(pay.health)}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-muted">Daň z příjmu</span>
            <span className="tabular">{formatCzk(pay.tax)}</span>
          </li>
          <li className="flex justify-between font-medium">
            <span>Na účet</span>
            <span className="tabular">{formatCzk(pay.net)}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-muted">Měsíční výdaje</span>
            <span className="tabular">{formatCzk(monthlyOutgoings(game))}</span>
          </li>
        </ul>
        <p className="mt-3 text-xs text-faint">Stav: {game.employed ? "zaměstnaný" : "bez práce"}</p>
        {game.employed ? (
          <Button className="mt-4" variant="outline" onClick={leaveJob}>
            Dát výpověď
          </Button>
        ) : null}
      </section>

      <section className="rounded-lg border border-line bg-surface p-4">
        <p className="text-xs text-muted">Dluh a čas</p>
        <p className="mt-2 text-sm text-muted">
          Spotřebitelský úvěr 12,9 % p.a. na 5 let. Hypotéky spravuješ v záložce Byty.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="quiet" onClick={() => loan(50_000)}>
            Půjčit 50 000 Kč
          </Button>
          <Button size="sm" variant="quiet" onClick={() => waitDays(30)}>
            Počkat měsíc
          </Button>
          <Button size="sm" variant="danger" onClick={reset}>
            Restartovat život
          </Button>
        </div>
        {game.loans.length ? (
          <ul className="mt-4 space-y-2 text-sm">
            {game.loans.map((l) => (
              <li key={l.id} className="flex justify-between">
                <span className="text-muted">
                  {l.kind === "mortgage" ? "Hypotéka" : "Spotřebák"} · {l.monthsLeft} měs.
                </span>
                <span className="tabular">{formatCzk(l.remaining)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted">Žádné úvěry.</p>
        )}
        <p className="mt-4 text-xs text-faint">Start: {formatDate(game.startedAt)}</p>
      </section>

      <section className="rounded-lg border border-line bg-surface p-4 lg:col-span-2">
        <p className="text-xs text-muted">Daňový rok {game.ytd.year}</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Mini k="Hrubé mzdy" v={formatCzk(game.ytd.wage)} />
          <Mini k="Příjmy z krypta" v={formatCzk(game.ytd.cryptoProceeds)} />
          <Mini k="Zdanitelný zisk" v={formatCzk(game.ytd.taxableGains)} />
          <Mini k="Daň zaplacená" v={formatCzk(game.ytd.taxPaid)} />
        </div>
      </section>

      <section className="rounded-lg border border-line bg-surface p-4 lg:col-span-2">
        <p className="text-xs text-muted">Pohyby</p>
        <ul className="mt-3 max-h-80 overflow-auto text-sm">
          {game.ledger.slice(0, 40).map((e) => (
            <li key={e.id} className="flex justify-between gap-3 border-b border-line/50 py-2">
              <span>
                <span className="text-muted">{formatDate(e.at)} · </span>
                {e.label}
              </span>
              <span className={`tabular ${e.amount >= 0 ? "text-up" : "text-down"}`}>
                {formatCzk(e.amount)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Mini({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{k}</p>
      <p className="tabular">{v}</p>
    </div>
  );
}
