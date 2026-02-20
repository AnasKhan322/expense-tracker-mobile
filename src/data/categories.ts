export const categories = [
  { key: "Food", icon: "fast-food", color: "#FF4D4D" },
  { key: "Health", icon: "heart", color: "#FF2D55" },
  { key: "Transport", icon: "car", color: "#0A84FF" },
  { key: "Shopping", icon: "cart", color: "#AF52DE" },
  { key: "Bills", icon: "receipt", color: "#FF9F0A" },
  { key: "Entertainment", icon: "game-controller", color: "#64D2FF" },

  { key: "Salary", icon: "cash", color: "#34C759" },
  { key: "Gift", icon: "gift", color: "#FFD60A" },
  { key: "Freelance", icon: "briefcase", color: "#32D74B" },
  { key: "Other", icon: "pricetag", color: "#8E8E93" },
] as const;

export function getCategoryMeta(category: string) {
  return (
    categories.find((c) => c.key === category) ?? {
      key: category,
      icon: "pricetag",
      color: "#8E8E93",
    }
  );
}
