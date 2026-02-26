import type { Transaction } from "../types/transaction";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export type TxSection = { title: string; data: Transaction[] };

export function groupTransactionsByDate(
  transactions: Transaction[],
): TxSection[] {
  const now = new Date();
  const today = startOfDay(now);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const sections: TxSection[] = [
    { title: "Today", data: [] },
    { title: "Yesterday", data: [] },
    { title: "This Month", data: [] },
    { title: "Older", data: [] },
  ];

  for (const tx of transactions) {
    const d = new Date(tx.date);

    if (isSameDay(d, today)) sections[0].data.push(tx);
    else if (isSameDay(d, yesterday)) sections[1].data.push(tx);
    else if (isSameMonth(d, now)) sections[2].data.push(tx);
    else sections[3].data.push(tx);
  }

  return sections.filter((s) => s.data.length > 0);
}
