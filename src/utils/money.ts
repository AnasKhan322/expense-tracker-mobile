import { Transaction } from "../types/transaction";

export function totals(items: Transaction[]) {
  const income = items
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = items
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    income,
    expense,
    balance: income - expense,
  };
}

export function formatMoney(n: number) {
  return `$ ${n.toFixed(2)}`;
}
