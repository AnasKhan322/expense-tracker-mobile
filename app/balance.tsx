// app/balance.tsx
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import DonutRing from "../src/components/donutRing";
import { getCategoryMeta } from "../src/data/categories";
import { useSettingsStore } from "../src/store/settingsStore";
import { useTransactionsStore } from "../src/store/transactionsStore";
import type { Transaction } from "../src/types/transaction";
import { formatMoney, totals } from "../src/utils/money";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default function BalanceScreen() {
  const currency = useSettingsStore((s) => s.currency);
  const transactions = useTransactionsStore((s) => s.transactions);

  const t = useMemo(() => totals(transactions), [transactions]);

  const now = new Date();
  const monthStart = startOfMonth(now).getTime();

  const thisMonth = useMemo(() => {
    const items = transactions.filter(
      (x) => new Date(x.date).getTime() >= monthStart,
    );
    return totals(items);
  }, [transactions, monthStart]);

  const expenseTotal = Math.max(0, t.expense);
  const incomeTotal = Math.max(0, t.income);
  const denom = incomeTotal + expenseTotal;

  const expensePct = denom === 0 ? 0 : Math.round((expenseTotal / denom) * 100);
  const incomePct = denom === 0 ? 0 : 100 - expensePct;

  const donutProgress = denom === 0 ? 0 : incomeTotal / denom; // 0..1

  // Top expense categories
  const topExpenseCats = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.type !== "expense") continue;
      map.set(tx.category, (map.get(tx.category) ?? 0) + tx.amount);
    }
    return Array.from(map.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [transactions]);

  // Largest expense transactions
  const largestExpenses = useMemo(() => {
    return transactions
      .filter((x) => x.type === "expense")
      .slice()
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{
          padding: 18,
          paddingTop: 12,
          paddingBottom: 40,
        }}
      >
        {/* Overview */}
        <View
          style={{
            backgroundColor: "#0d0d0d",
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "#151515",
            padding: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <DonutRing
              size={120}
              stroke={12}
              progress={donutProgress}
              incomePct={incomePct}
              expensePct={expensePct}
            />

            <View style={{ flex: 1 }}>
              <Text style={{ color: "#bdbdbd", fontWeight: "800" }}>
                Total Balance
              </Text>
              <Text
                style={{
                  color: "white",
                  fontWeight: "900",
                  fontSize: 22,
                  marginTop: 6,
                }}
                numberOfLines={1}
              >
                {formatMoney(t.balance, currency)}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  marginTop: 12,
                  justifyContent: "space-between",
                }}
              >
                <View>
                  <Text style={{ color: "#9a9a9a", fontWeight: "800" }}>
                    Income
                  </Text>
                  <Text
                    style={{
                      color: "#34C759",
                      fontWeight: "900",
                      marginTop: 4,
                    }}
                    numberOfLines={1}
                  >
                    {formatMoney(t.income, currency)}
                  </Text>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: "#9a9a9a", fontWeight: "800" }}>
                    Expense
                  </Text>
                  <Text
                    style={{
                      color: "#FF453A",
                      fontWeight: "900",
                      marginTop: 4,
                    }}
                    numberOfLines={1}
                  >
                    {formatMoney(t.expense, currency)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* This month */}
        <View
          style={{
            marginTop: 12,
            backgroundColor: "#0d0d0d",
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "#151515",
            padding: 16,
          }}
        >
          <Text style={{ color: "white", fontWeight: "900", marginBottom: 10 }}>
            This Month
          </Text>

          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View>
              <Text style={{ color: "#9a9a9a", fontWeight: "800" }}>
                Income
              </Text>
              <Text
                style={{ color: "#34C759", fontWeight: "900", marginTop: 4 }}
                numberOfLines={1}
              >
                {formatMoney(thisMonth.income, currency)}
              </Text>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ color: "#9a9a9a", fontWeight: "800" }}>
                Expense
              </Text>
              <Text
                style={{ color: "#FF453A", fontWeight: "900", marginTop: 4 }}
                numberOfLines={1}
              >
                {formatMoney(thisMonth.expense, currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Top Expense Categories */}
        <View style={{ marginTop: 14 }}>
          <Text
            style={{
              color: "white",
              fontWeight: "900",
              fontSize: 16,
              marginBottom: 10,
            }}
          >
            Top Expense Categories
          </Text>

          <View style={{ gap: 10 }}>
            {topExpenseCats.length === 0 ? (
              <Text style={{ color: "#aaa" }}>No expenses yet.</Text>
            ) : (
              topExpenseCats.map((row) => {
                const meta = getCategoryMeta(row.category as any);
                const pct =
                  expenseTotal === 0
                    ? 0
                    : Math.round((row.total / expenseTotal) * 100);

                return (
                  <View
                    key={row.category}
                    style={{
                      backgroundColor: "#0d0d0d",
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: "#151515",
                      padding: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 14,
                        backgroundColor: meta.color,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons
                        name={meta.icon as any}
                        size={18}
                        color="#fff"
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "white", fontWeight: "900" }}>
                        {meta.label}
                      </Text>
                      <Text
                        style={{
                          color: "#9a9a9a",
                          fontWeight: "800",
                          marginTop: 4,
                        }}
                        numberOfLines={1}
                      >
                        {formatMoney(row.total, currency)} • {pct}%
                      </Text>
                    </View>

                    <View
                      style={{
                        width: 52,
                        height: 8,
                        borderRadius: 999,
                        backgroundColor: "#1b1b1b",
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          width: `${Math.min(100, Math.max(0, pct))}%`,
                          height: "100%",
                          backgroundColor: "#9DFF3A",
                        }}
                      />
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* Largest Expenses */}
        <View style={{ marginTop: 16 }}>
          <Text
            style={{
              color: "white",
              fontWeight: "900",
              fontSize: 16,
              marginBottom: 10,
            }}
          >
            Largest Expenses
          </Text>

          <View style={{ gap: 10 }}>
            {largestExpenses.length === 0 ? (
              <Text style={{ color: "#aaa" }}>No expenses yet.</Text>
            ) : (
              largestExpenses.map((tx: Transaction) => {
                const meta = getCategoryMeta(tx.category as any);
                return (
                  <Pressable
                    key={tx.id}
                    onPress={() =>
                      router.push({
                        pathname: "/transaction/[id]",
                        params: { id: tx.id },
                      })
                    }
                    style={{
                      backgroundColor: "#0d0d0d",
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: "#151515",
                      padding: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 14,
                        backgroundColor: meta.color,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons
                        name={meta.icon as any}
                        size={18}
                        color="#fff"
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={{ color: "white", fontWeight: "900" }}
                        numberOfLines={1}
                      >
                        {tx.title}
                      </Text>
                      <Text
                        style={{
                          color: "#9a9a9a",
                          fontWeight: "800",
                          marginTop: 4,
                        }}
                        numberOfLines={1}
                      >
                        {meta.label}
                      </Text>
                    </View>

                    <Text style={{ color: "#FF453A", fontWeight: "900" }}>
                      - {formatMoney(tx.amount, currency)}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
