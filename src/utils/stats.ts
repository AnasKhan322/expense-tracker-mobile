import { Transaction } from "../types/transaction";

export type RangeKey = "7d" | "30d" | "90d" | "ytd" | "all";

export function filterByRange(
  items: Transaction[],
  range: RangeKey,
): Transaction[] {
  if (range === "all") return items;

  const now = new Date();
  let start: Date;

  if (range === "ytd") {
    start = new Date(now.getFullYear(), 0, 1);
  } else {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    start = new Date(now);
    start.setDate(start.getDate() - days);
  }

  const startMs = start.getTime();
  return items.filter((t) => new Date(t.date).getTime() >= startMs);
}

export function sumIncome(items: Transaction[]): number {
  return items.reduce(
    (acc, t) => (t.type === "income" ? acc + t.amount : acc),
    0,
  );
}

export function sumExpense(items: Transaction[]): number {
  return items.reduce(
    (acc, t) => (t.type === "expense" ? acc + t.amount : acc),
    0,
  );
}

export function groupByCategory(
  items: Transaction[],
  mode: "expense" | "income",
): { category: string; total: number; count: number }[] {
  const map = new Map<string, { total: number; count: number }>();

  for (const t of items) {
    if (t.type !== mode) continue;
    const prev = map.get(t.category) ?? { total: 0, count: 0 };
    map.set(t.category, {
      total: prev.total + t.amount,
      count: prev.count + 1,
    });
  }

  return [...map.entries()]
    .map(([category, v]) => ({ category, total: v.total, count: v.count }))
    .sort((a, b) => b.total - a.total);
}
