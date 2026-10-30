// Auction dates are stored as YYYY-MM-DD; show them as e.g. "15 November 2026".
export function formatAuctionDate(value?: string): string {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export function isValidAuctionDate(value: string): boolean {
  const formatted = formatAuctionDate(value);
  // Rejects impossible dates such as 2026-02-31, which Date would roll over.
  return Boolean(formatted) && new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);
}
