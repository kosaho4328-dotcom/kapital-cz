export type CityId = "praha" | "brno" | "ostrava" | "plzen";

export type City = {
  id: CityId;
  name: string;
  tagline: string;
  jobTitle: string;
  grossMonthly: number;
  rent1kk: number;
  rent2kk: number;
  pricePerM2: number;
  livingCost: number;
};

export const CITIES: City[] = [
  {
    id: "praha",
    name: "Praha",
    tagline: "Nejvyšší plat, nejdražší bydlení.",
    jobTitle: "Junior software developer",
    grossMonthly: 52_000,
    rent1kk: 16_500,
    rent2kk: 24_800,
    pricePerM2: 156_000,
    livingCost: 9_800,
  },
  {
    id: "brno",
    name: "Brno",
    tagline: "Solidní kompromis mezi příjmem a náklady.",
    jobTitle: "Junior software developer",
    grossMonthly: 45_000,
    rent1kk: 13_800,
    rent2kk: 20_100,
    pricePerM2: 95_000,
    livingCost: 8_200,
  },
  {
    id: "ostrava",
    name: "Ostrava",
    tagline: "Nižší plat, výrazně nižší náklady a dostupnější byty.",
    jobTitle: "Junior software developer",
    grossMonthly: 39_000,
    rent1kk: 9_000,
    rent2kk: 14_900,
    pricePerM2: 55_000,
    livingCost: 7_100,
  },
  {
    id: "plzen",
    name: "Plzeň",
    tagline: "Regionální město s nižšími nájmy než Praha.",
    jobTitle: "Junior software developer",
    grossMonthly: 43_000,
    rent1kk: 10_900,
    rent2kk: 14_700,
    pricePerM2: 78_000,
    livingCost: 7_600,
  },
];

export function getCity(id: CityId) {
  return CITIES.find((c) => c.id === id) ?? CITIES[0];
}
