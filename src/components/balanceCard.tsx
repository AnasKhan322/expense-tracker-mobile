// src/components/balanceCard.tsx
import React from "react";
import { Text, View } from "react-native";
import { useSettingsStore } from "../store/settingsStore";
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
  const currency = useSettingsStore((s) => s.currency);

  return (
    <View
      style={{
        backgroundColor: "#0d0d0d",
        borderRadius: 18,
        padding: 16,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: "#151515",
      }}
    >
      <Text style={{ color: "#bdbdbd", marginBottom: 6, fontWeight: "800" }}>
        Total Balance
      </Text>

      <Text
        style={{
          fontSize: 28,
          fontWeight: "900",
          marginBottom: 14,
          color: "white",
        }}
        numberOfLines={1}
      >
        {formatMoney(balance, currency)}
      </Text>

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View>
          <Text style={{ color: "#9a9a9a", fontWeight: "800" }}>Income</Text>
          <Text style={{ color: "#34C759", fontWeight: "900", marginTop: 4 }}>
            {formatMoney(income, currency)}
          </Text>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ color: "#9a9a9a", fontWeight: "800" }}>Expense</Text>
          <Text style={{ color: "#FF453A", fontWeight: "900", marginTop: 4 }}>
            {formatMoney(expense, currency)}
          </Text>
        </View>
      </View>
    </View>
  );
}
