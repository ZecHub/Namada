const units = [
  { value: 1_000_000_000, suffix: "B" },
  { value: 1_000_000, suffix: "M" },
  { value: 1_000, suffix: "K" },
];

/**
 * Chart data stores Namada in raw NAM and other assets in millions of units.
 * Convert both representations back to user-facing supply units before labels
 * or tooltips display them.
 */
export function formatSupplyAmount(value: number, tokenId: string): string {
  if (!Number.isFinite(value)) return "—";
  const amount = tokenId === "Namada" ? value : value * 1_000_000;
  const unit = units.find(({ value: threshold }) => Math.abs(amount) >= threshold);
  if (!unit) return amount.toLocaleString("en-US", { maximumFractionDigits: 1 });
  return `${(amount / unit.value).toLocaleString("en-US", {
    maximumFractionDigits: 1,
  })}${unit.suffix}`;
}
