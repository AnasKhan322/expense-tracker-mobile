// src/utils/money.ts
import type { Transaction } from "../types/transaction";

export function formatMoney(n: number): string {
  // simple, stable formatting (no Intl issues on Android emulators)
  const fixed = Number.isFinite(n) ? n.toFixed(2) : "0.00";
  return `$ ${fixed}`;
}

export function totals(items: Transaction[]) {
  let income = 0;
  let expense = 0;

  for (const t of items) {
    if (t.type === "income") income += t.amount;
    else expense += t.amount;
  }

  return {
    income,
    expense,
    balance: income - expense,
  };
}
