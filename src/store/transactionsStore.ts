import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import type { CategoryId } from "../data/categories";
import type { Transaction, TransactionType } from "../types/transaction";

const STORAGE_KEY = "transactions";
export type SortKey = "date" | "amount";
export type SortDir = "desc" | "asc";

export type TxFilters = {
  type: TransactionType | "all";
  category: CategoryId | "all";
};

export type NewTransactionInput = {
  title: string;
  amount: number;
  type: TransactionType;
  category: CategoryId;
  date: string; // ISO string
};

type TxState = {
  hydrated: boolean;
  transactions: Transaction[];

  filters: TxFilters;
  sortKey: SortKey;
  sortDir: SortDir;
  setFilters: (patch: Partial<TxFilters>) => void;
  setSort: (key: SortKey, dir: SortDir) => void;
  clearFilters: () => void;
  hydrate: () => Promise<void>;
  add: (input: NewTransactionInput) => Promise<void>;
  update: (tx: Transaction) => Promise<void>;
  remove: (id: string) => Promise<void>;
  getById: (id: string) => Transaction | undefined;
  // getVisible: () => Transaction[];
};

async function persist(items: Transaction[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function makeId() {
  // crypto.randomUUID isn't always available on all RN targets
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const useTransactionsStore = create<TxState>((set, get) => ({
  hydrated: false,
  transactions: [],

  // NEW defaults
  filters: { type: "all", category: "all" },
  sortKey: "date",
  sortDir: "desc",

  setFilters: (patch) => set({ filters: { ...get().filters, ...patch } }),
  setSort: (key, dir) => set({ sortKey: key, sortDir: dir }),
  clearFilters: () => set({ filters: { type: "all", category: "all" } }),

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed: Transaction[] = raw ? JSON.parse(raw) : [];
      parsed.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      set({ transactions: parsed, hydrated: true });
    } catch {
      set({ transactions: [], hydrated: true });
    }
  },

  add: async (input) => {
    const now = new Date().toISOString();

    const tx: Transaction = {
      id: makeId(),
      title: input.title,
      amount: input.amount,
      type: input.type,
      category: input.category,
      date: input.date,
      createdAt: now,
      updatedAt: now,
    };

    const next = [tx, ...get().transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    set({ transactions: next });
    await persist(next);
  },

  update: async (tx) => {
    const next = get()
      .transactions.map((t) =>
        t.id === tx.id ? { ...tx, updatedAt: new Date().toISOString() } : t,
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    set({ transactions: next });
    await persist(next);
  },

  remove: async (id) => {
    const next = get().transactions.filter((t) => t.id !== id);
    set({ transactions: next });
    await persist(next);
  },

  getById: (id) => get().transactions.find((t) => t.id === id),

  // NEW derived getter
  // getVisible: () => {
  //   const { transactions, filters, sortKey, sortDir } = get();

  //   const filtered = transactions.filter((t) => {
  //     if (filters.type !== "all" && t.type !== filters.type) return false;
  //     if (filters.category !== "all" && t.category !== filters.category)
  //       return false;
  //     return true;
  //   });

  //   const dir = sortDir === "asc" ? 1 : -1;

  //   return filtered.sort((a, b) => {
  //     if (sortKey === "amount") return (a.amount - b.amount) * dir;
  //     return (new Date(a.date).getTime() - new Date(b.date).getTime()) * dir;
  //   });
  // },
}));
