import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { getCategoryMeta } from "../data/categories";
import { Transaction } from "../types/transaction";
import { formatMoney } from "../utils/money";

export default function TransactionItem({ item }: { item: Transaction }) {
  const meta = getCategoryMeta(item.category);
  const isExpense = item.type === "expense";

  const date = new Date(item.date);
  const dateLabel = `${date.getDate()} ${date.toLocaleString("en-US", { month: "short" })}`;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#222",
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          backgroundColor: meta.color,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Ionicons name={meta.icon as any} size={20} color="white" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ color: "white", fontWeight: "700" }}>
          {item.category}
        </Text>
        <Text style={{ color: "#9a9a9a", marginTop: 2 }}>{item.title}</Text>
      </View>

      <View style={{ alignItems: "flex-end" }}>
        <Text
          style={{
            color: isExpense ? "#FF453A" : "#34C759",
            fontWeight: "800",
          }}
        >
          {isExpense ? "-" : "+"}
          {formatMoney(item.amount)}
        </Text>
        <Text style={{ color: "#9a9a9a", marginTop: 2 }}>{dateLabel}</Text>
      </View>
    </View>
  );
}
