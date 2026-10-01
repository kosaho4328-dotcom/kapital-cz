/** Czech 2026 employment + capital-gains rules used in the sim. */

export const TAX_CREDIT_MONTHLY = 2570;
export const EMPLOYEE_SOCIAL = 0.065;
export const EMPLOYEE_HEALTH = 0.045;
export const TAX_RATE_LOW = 0.15;
export const TAX_RATE_HIGH = 0.23;
export const HIGH_TAX_THRESHOLD_YEARLY = 1_762_812;
export const CRYPTO_PROCEEDS_EXEMPT = 100_000;
export const HOLDING_YEARS = 3;
export const FX_SPREAD = 0.005;
export const STOCK_COMMISSION = 0;
export const CRYPTO_COMMISSION = 0;
export const MORTGAGE_RATE = 0.055;
export const PROPERTY_TAX_RATE = 0.002;
export const MAINTENANCE_RATE = 0.01;

export type Payroll = {
  gross: number;
  social: number;
  health: number;
  tax: number;
  net: number;
};

export function payrollFromGross(gross: number): Payroll {
  const social = Math.round(gross * EMPLOYEE_SOCIAL);
  const health = Math.round(gross * EMPLOYEE_HEALTH);
  const taxRaw = Math.round(gross * TAX_RATE_LOW) - TAX_CREDIT_MONTHLY;
  const tax = Math.max(0, taxRaw);
  const net = gross - social - health - tax;
  return { gross, social, health, tax, net };
}

export function mortgagePayment(principal: number, annualRate: number, years: number) {
  const r = annualRate / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function yearsHeld(boughtAt: string, nowMs: number) {
  const start = new Date(boughtAt).getTime();
  return (nowMs - start) / (365.25 * 24 * 3600 * 1000);
}

export function isTimeTestExempt(boughtAt: string, nowMs: number) {
  return yearsHeld(boughtAt, nowMs) >= HOLDING_YEARS;
}
