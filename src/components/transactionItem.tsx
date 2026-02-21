import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, Text, View } from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";

import { getCategoryMeta } from "../data/categories";
import { Transaction } from "../types/transaction";
import { formatMoney } from "../utils/money";

const ACTION_WIDTH_EDIT = 84;
const ACTION_WIDTH_DELETE = 90;
const ROW_HEIGHT = 74;
export default function TransactionItem({
  item,
  onPress,
  onEdit,
  onDelete,
}: {
  item: Transaction;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meta = getCategoryMeta(item.category);
  const isExpense = item.type === "expense";

  const date = new Date(item.date);
  const dateLabel = `${date.getDate()} ${date.toLocaleString("en-US", { month: "short" })}`;

  const RightActions = () => (
    <View style={{ flexDirection: "row", height: ROW_HEIGHT }}>
      <Pressable
        onPress={onEdit}
        style={{
          width: ACTION_WIDTH_EDIT,
          backgroundColor: "#2A2A2A",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Ionicons name="create-outline" size={22} color="white" />
        <Text
          style={{
            color: "white",
            marginTop: 4,
            fontWeight: "800",
            fontSize: 12,
          }}
        >
          Edit
        </Text>
      </Pressable>

      <Pressable
        onPress={() => {
          Alert.alert("Delete transaction?", "This cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: onDelete },
          ]);
        }}
        style={{
          width: ACTION_WIDTH_DELETE,
          backgroundColor: "#FF453A",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Ionicons name="trash-outline" size={22} color="white" />
        <Text
          style={{
            color: "white",
            marginTop: 4,
            fontWeight: "900",
            fontSize: 12,
          }}
        >
          Delete
        </Text>
      </Pressable>
    </View>
  );

  return (
    <Swipeable
      renderRightActions={RightActions}
      overshootRight={false}
      rightThreshold={80}
      friction={2}
    >
      <Pressable
        onPress={onPress}
        style={{
          height: ROW_HEIGHT,
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: "#222",
        }}
      >
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 16,
            backgroundColor: meta.color,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Ionicons name={meta.icon as any} size={20} color="white" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ color: "white", fontWeight: "800" }}>
            {item.category}
          </Text>
          <Text style={{ color: "#9a9a9a", marginTop: 2 }}>{item.title}</Text>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text
            style={{
              color: isExpense ? "#FF453A" : "#34C759",
              fontWeight: "900",
            }}
          >
            {isExpense ? "-" : "+"}
            {formatMoney(item.amount)}
          </Text>
          <Text style={{ color: "#9a9a9a", marginTop: 2 }}>{dateLabel}</Text>
        </View>
      </Pressable>
    </Swipeable>
  );
}
