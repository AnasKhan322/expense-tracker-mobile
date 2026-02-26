// src/utils/money.ts
import type { Transaction } from "../types/transaction";

export function formatMoney(amount: number, currency: string = "USD") {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
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
