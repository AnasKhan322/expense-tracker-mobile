// src/store/settingsStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const KEY = "settings_v3";

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

  // general
  currency: CurrencyCode;

  // monthly category limits
  limits: Record<string, number>;

  /**
   * Day of month (1..28) when the app considers the "limits cycle" refreshed.
   * We keep it capped at 28 to avoid invalid dates (Feb, etc).
   */
  limitsRefreshDay: number;

  /**
   * Cycle key like "2026-03" that marks the latest limits cycle
   * the user has acknowledged.
   */
  limitsCycleKey: string;

  /**
   * True when we've entered a new cycle (based on limitsRefreshDay)
   * and the user should review/reuse limits.
   */
  needsLimitsReview: boolean;

  // actions
  hydrate: () => Promise<void>;
  setCurrency: (c: CurrencyCode) => Promise<void>;

  setLimit: (category: string, amount: number) => Promise<void>;
  removeLimit: (category: string) => Promise<void>;
  clearAllLimits: () => Promise<void>;

  setLimitsRefreshDay: (day: number) => Promise<void>;
  acknowledgeLimitsReview: () => Promise<void>;
};

type PersistedSettings = {
  v: number;
  currency: CurrencyCode;
  limits?: Record<string, number>;

  limitsRefreshDay?: number;
  limitsCycleKey?: string;
};

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Cycle key depends on refresh day:
 * - If today >= refreshDay => current month key
 * - Else => previous month key
 */
function computeCycleKey(d: Date, refreshDay: number) {
  const day = Math.max(1, Math.min(28, Math.floor(refreshDay || 1)));
  const currentMonth = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);

  if (d.getDate() >= day) return monthKey(currentMonth);

  // previous month
  const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1, 0, 0, 0, 0);
  return monthKey(prev);
}

async function persist(data: PersistedSettings) {
  await AsyncStorage.setItem(KEY, JSON.stringify(data));
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  hydrated: false,

  currency: "USD",
  limits: {},

  limitsRefreshDay: 1,
  limitsCycleKey: computeCycleKey(new Date(), 1),
  needsLimitsReview: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      const parsed: PersistedSettings | null = raw ? JSON.parse(raw) : null;

      if (!parsed) {
        set({ hydrated: true });
        return;
      }

      const currency = parsed.currency ?? "USD";
      const limits = parsed.limits ?? {};

      const limitsRefreshDay =
        typeof parsed.limitsRefreshDay === "number"
          ? Math.max(1, Math.min(28, Math.floor(parsed.limitsRefreshDay)))
          : 1;

      const now = new Date();
      const currentCycle = computeCycleKey(now, limitsRefreshDay);

      const savedCycle =
        typeof parsed.limitsCycleKey === "string" &&
        parsed.limitsCycleKey.length > 0
          ? parsed.limitsCycleKey
          : currentCycle;

      const hasAnyLimits = Object.keys(limits).length > 0;
      const needsLimitsReview = hasAnyLimits && savedCycle !== currentCycle;

      set({
        currency,
        limits,
        limitsRefreshDay,
        limitsCycleKey: savedCycle,
        needsLimitsReview,
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },

  setCurrency: async (c) => {
    set({ currency: c });

    const { limits, limitsRefreshDay, limitsCycleKey } = get();
    await persist({
      v: 3,
      currency: c,
      limits,
      limitsRefreshDay,
      limitsCycleKey,
    });
  },

  setLimit: async (category, amount) => {
    const { currency, limits, limitsRefreshDay, limitsCycleKey } = get();

    const updated = { ...limits, [category]: amount };
    set({ limits: updated });

    await persist({
      v: 3,
      currency,
      limits: updated,
      limitsRefreshDay,
      limitsCycleKey,
    });
  },

  removeLimit: async (category) => {
    const { currency, limits, limitsRefreshDay, limitsCycleKey } = get();

    const updated = { ...limits };
    delete updated[category];
    set({ limits: updated });

    await persist({
      v: 3,
      currency,
      limits: updated,
      limitsRefreshDay,
      limitsCycleKey,
    });
  },

  clearAllLimits: async () => {
    const { currency, limitsRefreshDay, limitsCycleKey } = get();

    set({ limits: {} });

    await persist({
      v: 3,
      currency,
      limits: {},
      limitsRefreshDay,
      limitsCycleKey,
    });
  },

  setLimitsRefreshDay: async (day) => {
    const d = Math.max(1, Math.min(28, Math.floor(day || 1)));
    const { currency, limits } = get();

    const now = new Date();
    const currentCycle = computeCycleKey(now, d);

    // If user changes refresh day, we recompute cycle and potentially trigger review
    const hasAnyLimits = Object.keys(limits).length > 0;

    set({
      limitsRefreshDay: d,
      needsLimitsReview: hasAnyLimits, // safe default: prompt next time
      // don't change limitsCycleKey here; user should acknowledge after seeing prompt
    });

    await persist({
      v: 3,
      currency,
      limits,
      limitsRefreshDay: d,
      limitsCycleKey: currentCycle, // store computed baseline
    });
  },

  acknowledgeLimitsReview: async () => {
    const { currency, limits, limitsRefreshDay } = get();
    const now = new Date();
    const currentCycle = computeCycleKey(now, limitsRefreshDay);

    set({
      limitsCycleKey: currentCycle,
      needsLimitsReview: false,
    });

    await persist({
      v: 3,
      currency,
      limits,
      limitsRefreshDay,
      limitsCycleKey: currentCycle,
    });
  },
}));
