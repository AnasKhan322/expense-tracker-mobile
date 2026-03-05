// src/data/categories.ts
import { Ionicons } from "@expo/vector-icons";

export type CategoryId =
  | "Food"
  | "Health"
  | "Transport"
  | "Shopping"
  | "Bills"
  | "Entertainment"
  | "Salary"
  | "Gift"
  | "Freelance"
  | "Other";

export type CategoryType = "expense" | "income" | "both";

export type CategoryMeta = {
  key: CategoryId;
  label: string;
  type: CategoryType;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export const CATEGORIES: CategoryMeta[] = [
  // Expense
  {
    key: "Food",
    label: "Food",
    type: "expense",
    color: "#FF453A",
    icon: "restaurant",
  },
  {
    key: "Health",
    label: "Health",
    type: "expense",
    color: "#FF2D55",
    icon: "heart",
  },
  {
    key: "Transport",
    label: "Transport",
    type: "expense",
    color: "#0A84FF",
    icon: "car",
  },
  {
    key: "Shopping",
    label: "Shopping",
    type: "expense",
    color: "#AF52DE",
    icon: "cart",
  },
  {
    key: "Bills",
    label: "Bills",
    type: "expense",
    color: "#FF9F0A",
    icon: "receipt",
  },
  {
    key: "Entertainment",
    label: "Entertainment",
    type: "expense",
    color: "#64D2FF",
    icon: "game-controller",
  },

  // Income
  {
    key: "Salary",
    label: "Salary",
    type: "income",
    color: "#34C759",
    icon: "cash",
  },
  {
    key: "Freelance",
    label: "Freelance",
    type: "income",
    color: "#32D74B",
    icon: "briefcase",
  },
  {
    key: "Gift",
    label: "Gift",
    type: "income",
    color: "#30D158",
    icon: "gift",
  },

  // Shared fallback
  {
    key: "Other",
    label: "Other",
    type: "both",
    color: "#8E8E93",
    icon: "pricetag",
  },
];

export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);

export const EXPENSE_CATEGORY_KEYS = CATEGORIES.filter(
  (c) => c.type === "expense" || c.type === "both",
).map((c) => c.key);

export const INCOME_CATEGORY_KEYS = CATEGORIES.filter(
  (c) => c.type === "income" || c.type === "both",
).map((c) => c.key);

export function getCategoriesForType(type: "expense" | "income") {
  return CATEGORIES.filter((c) => c.type === type || c.type === "both");
}

/**
 * NEVER returns null. This is what fixes:
 * - icons disappearing
 * - "meta is possibly null"
 */
export function getCategoryMeta(key: string | null | undefined): CategoryMeta {
  const found = CATEGORIES.find((c) => c.key === key);
  if (found) return found;

  // hard fallback
  return {
    key: "Other",
    label: "Other",
    type: "both",
    color: "#8E8E93",
    icon: "pricetag",
  };
}
