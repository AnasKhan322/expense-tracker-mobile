export const categories = [
  { key: "Food", icon: "fast-food", color: "#FF4D4D" },
  { key: "Health", icon: "heart", color: "#FF2D55" },
  { key: "Transport", icon: "car", color: "#0A84FF" },
  { key: "Shopping", icon: "cart", color: "#AF52DE" },
  { key: "Salary", icon: "cash", color: "#34C759" },
  { key: "Gift", icon: "gift", color: "#FFD60A" },
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
