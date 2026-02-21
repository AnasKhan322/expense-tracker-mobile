import { Transaction } from "../types/transaction";

export type RangeKey = "7d" | "30d" | "90d" | "all";

export function filterByRange(items: Transaction[], range: RangeKey) {
  if (range === "all") return items;

  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  return items.filter((t) => new Date(t.date).getTime() >= cutoff);
}

export function sumIncome(items: Transaction[]) {
  return items
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
}

export function sumExpense(items: Transaction[]) {
  return items
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
}

export function groupByCategory(
  items: Transaction[],
  type: "income" | "expense",
) {
  const map = new Map<string, number>();

  for (const t of items) {
    if (t.type !== type) continue;
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  }

  const result = Array.from(map.entries()).map(([category, total]) => ({
    category,
    total,
  }));

  // biggest first
  result.sort((a, b) => b.total - a.total);

  return result;
}
