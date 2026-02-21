import { TransactionType } from "../types/transaction";

export type CategoryFor = TransactionType | "both";

export type Category = {
  key: string;
  icon: string;
  color: string;
  for: CategoryFor;
};

export const categories: Category[] = [
  { key: "Food", icon: "fast-food", color: "#FF4D4D", for: "expense" },
  { key: "Health", icon: "heart", color: "#FF2D55", for: "expense" },
  { key: "Transport", icon: "car", color: "#0A84FF", for: "expense" },
  { key: "Shopping", icon: "cart", color: "#AF52DE", for: "expense" },
  { key: "Bills", icon: "receipt", color: "#FF9F0A", for: "expense" },
  {
    key: "Entertainment",
    icon: "game-controller",
    color: "#64D2FF",
    for: "expense",
  },

  { key: "Salary", icon: "cash", color: "#34C759", for: "income" },
  { key: "Gift", icon: "gift", color: "#FFD60A", for: "income" },
  { key: "Freelance", icon: "briefcase", color: "#32D74B", for: "income" },

  { key: "Other", icon: "pricetag", color: "#8E8E93", for: "both" },
];

export function getCategoriesForType(type: TransactionType) {
  return categories.filter((c) => c.for === type || c.for === "both");
}

export function getCategoryMeta(category: string) {
  return (
    categories.find((c) => c.key === category) ?? {
      key: category,
      icon: "pricetag",
      color: "#8E8E93",
      for: "both" as const,
    }
  );
}
