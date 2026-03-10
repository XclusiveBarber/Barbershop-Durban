/**
 * Barber commission calculations
 *
 * Standard split: barber receives 65% of the service price,
 * the shop retains 35%.
 */

export const BARBER_COMMISSION_RATE = 0.65; // 65%
export const SHOP_REVENUE_RATE = 0.35;      // 35%

export interface PriceBreakdown {
  serviceTotal: number;
  barberEarnings: number;
  shopRevenue: number;
}

/**
 * Calculate the commission breakdown for a given service price.
 * Amounts are rounded to the nearest cent.
 */
export function calcBarberBreakdown(servicePrice: number): PriceBreakdown {
  const barberEarnings = Math.round(servicePrice * BARBER_COMMISSION_RATE * 100) / 100;
  const shopRevenue    = Math.round(servicePrice * SHOP_REVENUE_RATE    * 100) / 100;
  return { serviceTotal: servicePrice, barberEarnings, shopRevenue };
}

/** Parse a price value that may be a number or a string like "R200" / "200". */
export function parsePrice(value: number | string): number {
  if (typeof value === "number") return value;
  return parseFloat(value.toString().replace(/[^0-9.]/g, "")) || 0;
}

/** Format a numeric amount as a South-African Rand string, e.g. "R130.00". */
export function formatRand(amount: number): string {
  return `R${amount.toFixed(2)}`;
}
