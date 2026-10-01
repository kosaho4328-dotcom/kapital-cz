import { useState } from "react";
import { CITIES, type CityId } from "@/lib/cities";
import { payrollFromGross } from "@/lib/tax-cz";
import { formatCzk } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useGame } from "@/store/game-store";

export function Onboarding() {
  const start = useGame((s) => s.start);
  const [cityId, setCityId] = useState<CityId>("praha");
  const [name, setName] = useState("");
  const city = CITIES.find((c) => c.id === cityId)!;
  const pay = payrollFromGross(city.grossMonthly);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-5 py-10 sm:py-16">
        <header className="space-y-3">
          <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
            Kapital
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Žiješ v Česku.
            <br />
            Trhy běží teď.
          </h1>
          <p className="max-w-xl text-muted">
            Realistická simulace platu, nájmu, daní, hypotéky a investic. Ceny Bitcoinu
            a akcií se stahují živě. Stav se ukládá v prohlížeči.
          </p>
        </header>

        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-wider text-muted">Jméno</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jak se jmenuješ"
            className="h-12 rounded-md border border-line bg-surface px-4 text-fg outline-none focus:border-primary"
          />
        </label>

        <div className="grid gap-3">
          <p className="text-xs uppercase tracking-wider text-muted">Město</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {CITIES.map((c) => {
              const selected = c.id === cityId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCityId(c.id)}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    selected
                      ? "border-primary bg-raised"
                      : "border-line bg-surface hover:border-muted"
                  }`}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="font-medium">{c.name}</span>
                    <span className="tabular text-xs text-muted">
                      {formatCzk(payrollFromGross(c.grossMonthly).net)} netto
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">{c.tagline}</p>
                </button>
              );
            })}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 rounded-lg border border-line bg-surface p-4 sm:grid-cols-4">
          <Stat label="Hrubá mzda" value={formatCzk(city.grossMonthly)} />
          <Stat label="Na účet" value={formatCzk(pay.net)} />
          <Stat label="Nájem 1+kk" value={formatCzk(city.rent1kk)} />
          <Stat label="Start" value="30 000 Kč" />
        </dl>

        <Button size="lg" onClick={() => start(cityId, name)}>
          Začít život v {city.name}
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="tabular text-sm font-medium">{value}</dd>
    </div>
  );
}
