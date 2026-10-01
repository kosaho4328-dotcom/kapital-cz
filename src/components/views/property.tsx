import { CITIES } from "@/lib/cities";
import { formatCzk } from "@/lib/format";
import { MORTGAGE_RATE, mortgagePayment } from "@/lib/tax-cz";
import { useGame } from "@/store/game-store";
import { Button } from "@/components/ui/button";

export function PropertyView() {
  const game = useGame((s) => s.game)!;
  const purchaseHome = useGame((s) => s.purchaseHome);

  return (
    <div className="grid gap-6">
      <p className="text-sm text-muted">
        Ceny za m² odpovídají českému trhu 2026. Hypotéka: 20 % akontace, 5,5 % p.a., 30 let.
        První byt se stane tvým bydlením (přestaneš platit nájem). Další byty jdou do pronájmu.
      </p>

      {game.properties.length > 0 ? (
        <section className="grid gap-3">
          {game.properties.map((p) => (
            <article key={p.id} className="rounded-lg border border-line bg-surface p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-medium">{p.label}</h3>
                <span className="tabular">{formatCzk(p.purchasePrice)}</span>
              </div>
              <p className="mt-1 text-sm text-muted">
                {p.rented ? `Pronajato za ${formatCzk(p.monthlyRent)} / měs.` : "Bydlíš tady"}
              </p>
            </article>
          ))}
        </section>
      ) : null}

      <section className="grid gap-3 md:grid-cols-2">
        {CITIES.map((c) => {
          const m2 = 55;
          const price = c.pricePerM2 * m2;
          const down = Math.round(price * 0.2);
          const monthly = mortgagePayment(price - down, MORTGAGE_RATE, 30);
          return (
            <article key={c.id} className="rounded-lg border border-line bg-surface p-4">
              <h3 className="font-medium">{c.name} · 2+kk · {m2} m²</h3>
              <p className="tabular mt-2 text-xl">{formatCzk(price)}</p>
              <p className="mt-1 text-sm text-muted">
                {formatCzk(c.pricePerM2)} / m² · akontace {formatCzk(down)} · splátka{" "}
                {formatCzk(monthly)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => purchaseHome(c.id, "2kk", true)}>
                  Hypotéka
                </Button>
                <Button size="sm" variant="outline" onClick={() => purchaseHome(c.id, "2kk", false)}>
                  Zaplatit celé
                </Button>
                <Button size="sm" variant="quiet" onClick={() => purchaseHome(c.id, "1kk", true)}>
                  1+kk s hypotékou
                </Button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
