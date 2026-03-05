// app/category/[name].tsx
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCategoryMeta } from "../../src/data/categories";
import { useSettingsStore } from "../../src/store/settingsStore";
import { useTransactionsStore } from "../../src/store/transactionsStore";
import type { TransactionType } from "../../src/types/transaction";
import { formatMoney } from "../../src/utils/money";

type RangeKey = "7D" | "30D" | "90D" | "YTD" | "ALL";

function startOfYear(d: Date) {
  return new Date(d.getFullYear(), 0, 1);
}

function sinceForRange(range: RangeKey) {
  const now = new Date();
  if (range === "ALL") return null;
  if (range === "YTD") return startOfYear(now).getTime();

  const days = range === "7D" ? 7 : range === "30D" ? 30 : 90;
  const t = new Date(now);
  t.setDate(t.getDate() - days);
  return t.getTime();
}

export default function CategoryDetails() {
  const { name, mode, range } = useLocalSearchParams<{
    name?: string;
    mode?: TransactionType;
    range?: RangeKey;
  }>();

  const categoryKey = name ?? "Other";
  const meta = getCategoryMeta(categoryKey);

  const currency = useSettingsStore((s) => s.currency);
  const transactions = useTransactionsStore((s) => s.transactions);

  const since = useMemo(() => {
    if (!range) return null;
    return sinceForRange(range);
  }, [range]);

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => t.category === categoryKey)
      .filter((t) => {
        if (mode && t.type !== mode) return false;
        return true;
      })
      .filter((t) => {
        if (since == null) return true;
        return new Date(t.date).getTime() >= since;
      })
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, categoryKey, mode, since]);

  const incomeTotal = useMemo(
    () =>
      filtered
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + t.amount, 0),
    [filtered],
  );

  const expenseTotal = useMemo(
    () =>
      filtered
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0),
    [filtered],
  );

  const net = incomeTotal - expenseTotal;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text
            style={{ color: "white", fontSize: 24, fontWeight: "900", flex: 1 }}
          >
            {meta.label}
          </Text>

          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={{ padding: 8 }}
          >
            <Text style={{ color: "#9DFF3A", fontWeight: "900", fontSize: 16 }}>
              Back
            </Text>
          </Pressable>
        </View>

        {/* Totals card */}
        <View
          style={{
            backgroundColor: "#0d0d0d",
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "#151515",
            padding: 14,
            marginBottom: 14,
          }}
        >
          <Text
            style={{ color: "#8b8b8b", fontWeight: "900", marginBottom: 10 }}
          >
            Totals
          </Text>

          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View>
              <Text style={{ color: "#9a9a9a", fontWeight: "900" }}>
                Income
              </Text>
              <Text
                style={{
                  color: "#34C759",
                  fontWeight: "900",
                  marginTop: 6,
                  fontSize: 18,
                }}
              >
                {formatMoney(incomeTotal, currency)}
              </Text>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ color: "#9a9a9a", fontWeight: "900" }}>
                Expense
              </Text>
              <Text
                style={{
                  color: "#FF453A",
                  fontWeight: "900",
                  marginTop: 6,
                  fontSize: 18,
                }}
              >
                {formatMoney(expenseTotal, currency)}
              </Text>
            </View>
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: "#151515",
              marginVertical: 12,
            }}
          />

          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text style={{ color: "#9a9a9a", fontWeight: "900" }}>Net</Text>
            <Text style={{ color: "white", fontWeight: "900", fontSize: 18 }}>
              {formatMoney(net, currency)}
            </Text>
          </View>
        </View>

        {/* Transactions */}
        <Text
          style={{
            color: "white",
            fontSize: 18,
            fontWeight: "900",
            marginBottom: 10,
          }}
        >
          Transactions
        </Text>

        {filtered.length === 0 ? (
          <Text style={{ color: "#aaa" }}>
            No transactions in this category.
          </Text>
        ) : (
          <View style={{ gap: 12 }}>
            {filtered.map((t) => (
              <View
                key={t.id}
                style={{
                  backgroundColor: "#0d0d0d",
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: "#151515",
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 46,
                    height: 46,
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
                    style={{ color: "white", fontWeight: "900" }}
                    numberOfLines={1}
                  >
                    {t.title}
                  </Text>
                  <Text
                    style={{ color: "#777", fontWeight: "800", marginTop: 4 }}
                  >
                    {new Date(t.date).toLocaleDateString()}
                  </Text>
                </View>

                <Text
                  style={{
                    fontWeight: "900",
                    fontSize: 16,
                    color: t.type === "income" ? "#34C759" : "#FF453A",
                  }}
                >
                  {t.type === "income" ? "+" : "-"}{" "}
                  {formatMoney(t.amount, currency)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
