const LESSONS = [
  {
    t: "Jak se počítá výplata",
    b: "Z hrubé mzdy se strhne sociální pojištění 6,5 %, zdravotní 4,5 % a daň 15 % po slevě na poplatníka 2 570 Kč měsíčně. Superhrubá mzda už neexistuje.",
  },
  {
    t: "Kryptoměny a daň 2026",
    b: "Zisk z prodeje krypta je osvobozený, pokud držíš déle než 3 roky, nebo pokud roční příjmy (objem prodejů, ne zisk) nepřesáhnou 100 000 Kč. Jinak 15 % ze zisku, nad cca 1,76 mil. Kč základu 23 %.",
  },
  {
    t: "Akcie a ETF",
    b: "Cenné papíry mají také 3letý časový test. Nákupy v dolarech se v Kapitalu přepočítávají aktuálním kurzem. U reálného brokera počítej i s FX spreadem okolo 0,3–0,5 %.",
  },
  {
    t: "Nemovitosti",
    b: "Hypotéka tu modeluje 20 % akontace a 5,5 % sazbu. Vedle splátky platíš údržbu (~1 % ceny ročně) a daň z nemovitosti. Výnos z pronájmu snižuje tlak na mzdu.",
  },
  {
    t: "Čas v této simulaci",
    b: "Kotace BTC a akcií jsou živé (1:1 s realitou). Výplata, nájem a splátky se posouvají tlačítky +7 / +30 dní, aby šlo hrát dlouhodobý život, aniž bys čekal měsíce.",
  },
  {
    t: "Riziko",
    b: "Páka tu není. Bankrot nastane, když jsi hluboko v minusu na hotovosti i v čistém jmění. Trhy umí klesnout o desítky procent — proto nesázej vše do jednoho coinu.",
  },
];

export function LearnView() {
  return (
    <div className="grid gap-3">
      {LESSONS.map((l) => (
        <article key={l.t} className="rounded-lg border border-line bg-surface p-4">
          <h2 className="font-medium">{l.t}</h2>
          <p className="mt-2 text-sm text-muted">{l.b}</p>
        </article>
      ))}
    </div>
  );
}
