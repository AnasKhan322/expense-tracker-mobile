import { Text, View } from "react-native";
import { formatMoney } from "../utils/money";

export default function BalanceCard({
  balance,
  income,
  expense,
}: {
  balance: number;
  income: number;
  expense: number;
}) {
  return (
    <View
      style={{
        backgroundColor: "#EDEDED",
        borderRadius: 16,
        padding: 16,
        marginBottom: 18,
      }}
    >
      <Text style={{ color: "#555", marginBottom: 6 }}>Total Balance</Text>
      <Text style={{ fontSize: 28, fontWeight: "800", marginBottom: 14 }}>
        {formatMoney(balance)}
      </Text>

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View>
          <Text style={{ color: "#666" }}>Income</Text>
          <Text style={{ color: "#1E8E3E", fontWeight: "700", marginTop: 4 }}>
            {formatMoney(income)}
          </Text>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ color: "#666" }}>Expense</Text>
          <Text style={{ color: "#D93025", fontWeight: "700", marginTop: 4 }}>
            {formatMoney(expense)}
          </Text>
        </View>
      </View>
    </View>
  );
}
