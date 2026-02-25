// src/utils/date.ts

// returns today's date as ISO string (keeps time, like your store expects)
export function todayISODate() {
  return new Date().toISOString();
}

// for showing inside Add/Edit screen (YYYY-MM-DD)
export function formatDateInput(iso: string) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ✅ THIS is what TransactionItem is calling
export function formatShortDate(iso: string) {
  const d = new Date(iso);

  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString(undefined, { month: "short" }); // e.g. Feb

  return `${day} ${month}`;
}
