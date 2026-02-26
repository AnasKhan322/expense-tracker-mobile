// src/store/settingsStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const KEY = "settings_v1";

export type CurrencyCode =
  | "USD"
  | "EUR"
  | "GBP"
  | "EGP"
  | "SAR"
  | "AED"
  | "BHD"
  | "PKR";

type SettingsState = {
  hydrated: boolean;
  currency: CurrencyCode;
  hydrate: () => Promise<void>;
  setCurrency: (c: CurrencyCode) => Promise<void>;
};

async function persist(currency: CurrencyCode) {
  await AsyncStorage.setItem(KEY, JSON.stringify({ v: 1, currency }));
}

export const useSettingsStore = create<SettingsState>((set) => ({
  hydrated: false,
  currency: "USD",

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : null;

      if (parsed?.currency) {
        set({ currency: parsed.currency, hydrated: true });
      } else {
        set({ hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },

  setCurrency: async (c) => {
    set({ currency: c });
    await persist(c);
  },
}));
