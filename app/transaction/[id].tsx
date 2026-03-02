// app/transaction/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCategoryMeta } from "../../src/data/categories";
import { useSettingsStore } from "../../src/store/settingsStore";
import { useTransactionsStore } from "../../src/store/transactionsStore";
import { formatShortDate } from "../../src/utils/date";
import { formatMoney } from "../../src/utils/money";

export default function TransactionDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tx = useTransactionsStore((s) => s.getById(id));
  const currency = useSettingsStore((s) => s.currency);

  const meta = useMemo(() => (tx ? getCategoryMeta(tx.category) : null), [tx]);

  if (!tx || !meta) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
        <View style={{ padding: 18 }}>
          <Text style={{ color: "white", fontWeight: "900" }}>
            Transaction not found.
          </Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 12 }}>
            <Text style={{ color: "#9DFF3A", fontWeight: "900" }}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const sign = tx.type === "income" ? "+" : "-";
  const amountColor = tx.type === "income" ? "#34C759" : "#FF453A";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
      <View style={{ padding: 18 }}>
        <View
          style={{
            backgroundColor: "#0d0d0d",
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "#151515",
            padding: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 18,
                backgroundColor: meta.color,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name={meta.icon as any} size={20} color="#fff" />
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{ color: "white", fontWeight: "900", fontSize: 18 }}
                numberOfLines={1}
              >
                {tx.title}
              </Text>
              <Text
                style={{ color: "#9a9a9a", fontWeight: "800", marginTop: 4 }}
              >
                {meta.label}
              </Text>
            </View>
          </View>

          <View style={{ height: 14 }} />

          <Text style={{ color: "#bdbdbd", fontWeight: "800" }}>Amount</Text>
          <Text
            style={{
              color: amountColor,
              fontWeight: "900",
              fontSize: 26,
              marginTop: 6,
            }}
          >
            {sign} {formatMoney(tx.amount, currency)}
          </Text>

          <View style={{ height: 14 }} />

          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View>
              <Text style={{ color: "#9a9a9a", fontWeight: "800" }}>Type</Text>
              <Text style={{ color: "white", fontWeight: "900", marginTop: 4 }}>
                {tx.type === "income" ? "Income" : "Expense"}
              </Text>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ color: "#9a9a9a", fontWeight: "800" }}>Date</Text>
              <Text style={{ color: "white", fontWeight: "900", marginTop: 4 }}>
                {formatShortDate(tx.date)}
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={() =>
            router.push({
              pathname: "/transaction/edit/[id]",
              params: { id: tx.id },
            })
          }
          style={{
            marginTop: 14,
            paddingVertical: 14,
            borderRadius: 16,
            backgroundColor: "#9DFF3A",
          }}
        >
          <Text
            style={{ textAlign: "center", fontWeight: "900", color: "#111" }}
          >
            Edit
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
