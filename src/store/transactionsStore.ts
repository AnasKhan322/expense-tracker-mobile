import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { Transaction } from "../types/transaction";

const STORAGE_KEY = "transactions";

type TxState = {
  hydrated: boolean;
  transactions: Transaction[];

  hydrate: () => Promise<void>;
  add: (tx: Transaction) => Promise<void>;
  update: (tx: Transaction) => Promise<void>;
  remove: (id: string) => Promise<void>;
  getById: (id: string) => Transaction | undefined;
};

async function persist(items: Transaction[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const useTransactionsStore = create<TxState>((set, get) => ({
  hydrated: false,
  transactions: [],

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

  add: async (tx) => {
    const next = [tx, ...get().transactions];
    set({ transactions: next });
    await persist(next);
  },

  update: async (tx) => {
    const next = get().transactions.map((t) => (t.id === tx.id ? tx : t));
    set({ transactions: next });
    await persist(next);
  },

  remove: async (id) => {
    const next = get().transactions.filter((t) => t.id !== id);
    set({ transactions: next });
    await persist(next);
  },

  getById: (id) => get().transactions.find((t) => t.id === id),
}));
