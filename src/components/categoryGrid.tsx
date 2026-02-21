import { Ionicons } from "@expo/vector-icons";
import { FlatList, Pressable, Text, View } from "react-native";
import { Category, getCategoriesForType } from "../data/categories";
import { TransactionType } from "../types/transaction";

export default function CategoryGrid({
  selected,
  onSelect,
  type,
}: {
  selected: string;
  onSelect: (key: string) => void;
  type: TransactionType;
}) {
  const data = getCategoriesForType(type);

  const renderItem = ({ item }: { item: Category }) => {
    const isSelected = selected === item.key;

    return (
      <Pressable
        onPress={() => onSelect(item.key)}
        style={{
          flex: 1,
          margin: 6, // important for even spacing
          backgroundColor: isSelected ? "#1a1a1a" : "#111",
          borderRadius: 16,
          paddingVertical: 14,
          alignItems: "center",
          borderWidth: isSelected ? 1 : 0,
          borderColor: isSelected ? "#9DFF3A" : "transparent",
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: item.color,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 10,
          }}
        >
          <Ionicons name={item.icon as any} size={20} color="white" />
        </View>

        <Text style={{ color: "white", fontSize: 12 }} numberOfLines={1}>
          {item.key}
        </Text>
      </Pressable>
    );
  };

  return (
    <FlatList
      data={data}
      keyExtractor={(x) => x.key}
      renderItem={renderItem}
      numColumns={4}
      scrollEnabled={false}
      contentContainerStyle={{ paddingBottom: 4 }}
    />
  );
}
