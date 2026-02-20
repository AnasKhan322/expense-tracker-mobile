import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { categories } from "../data/categories";

export default function CategoryGrid({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (key: string) => void;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
      {categories.map((c) => {
        const isSelected = selected === c.key;
        return (
          <Pressable
            key={c.key}
            onPress={() => onSelect(c.key)}
            style={{
              width: "23%",
              backgroundColor: isSelected ? "#222" : "#111",
              borderRadius: 14,
              paddingVertical: 12,
              alignItems: "center",
              borderWidth: isSelected ? 1 : 0,
              borderColor: isSelected ? "#9DFF3A" : "transparent",
            }}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: c.color,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 8,
              }}
            >
              <Ionicons name={c.icon as any} size={18} color="white" />
            </View>
            <Text style={{ color: "white", fontSize: 11 }} numberOfLines={1}>
              {c.key}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
