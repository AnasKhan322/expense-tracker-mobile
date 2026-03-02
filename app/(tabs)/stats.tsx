// app/(tabs)/stats.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Segmented from "../../src/components/segmented";
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

export default function Stats() {
  const currency = useSettingsStore((s) => s.currency);
  const transactions = useTransactionsStore((s) => s.transactions);

  const [range, setRange] = useState<RangeKey>("30D");
  const [mode, setMode] = useState<TransactionType>("expense");

  const since = useMemo(() => sinceForRange(range), [range]);

  const scoped = useMemo(() => {
    if (since == null) return transactions;
    return transactions.filter((t) => new Date(t.date).getTime() >= since);
  }, [transactions, since]);

  const incomeTotal = useMemo(
    () =>
      scoped
        .filter((t) => t.type === "income")
        .reduce((a, b) => a + b.amount, 0),
    [scoped],
  );

  const expenseTotal = useMemo(
    () =>
      scoped
        .filter((t) => t.type === "expense")
        .reduce((a, b) => a + b.amount, 0),
    [scoped],
  );

  const net = incomeTotal - expenseTotal;

  const byCategory = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const tx of scoped) {
      if (tx.type !== mode) continue;
      const prev = map.get(tx.category) ?? { total: 0, count: 0 };
      map.set(tx.category, {
        total: prev.total + tx.amount,
        count: prev.count + 1,
      });
    }
    const arr = Array.from(map.entries()).map(([category, v]) => ({
      category,
      total: v.total,
      count: v.count,
    }));
    arr.sort((a, b) => b.total - a.total);
    return arr;
  }, [scoped, mode]);

  const top3 = byCategory.slice(0, 3);
  const denom = byCategory.reduce((s, x) => s + x.total, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <Text
          style={{
            color: "white",
            fontSize: 24,
            fontWeight: "900",
            marginBottom: 12,
          }}
        >
          Stats
        </Text>

        {/* Range pills (smaller) */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
          {(["7D", "30D", "90D", "YTD", "ALL"] as RangeKey[]).map((k) => {
            const active = k === range;
            return (
              <Pressable
                key={k}
                onPress={() => setRange(k)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  backgroundColor: active ? "#9DFF3A" : "#141414",
                }}
              >
                <Text
                  style={{ fontWeight: "900", color: active ? "#111" : "#bbb" }}
                >
                  {k}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Summary card (smaller) */}
        <View
          style={{
            backgroundColor: "#0d0d0d",
            borderRadius: 20,
            borderWidth: 1,
            borderColor: "#151515",
            padding: 14,
          }}
        >
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View>
              <Text
                style={{ color: "#9a9a9a", fontWeight: "900", fontSize: 14 }}
              >
                Income
              </Text>
              <Text
                style={{
                  color: "#34C759",
                  fontWeight: "900",
                  fontSize: 20,
                  marginTop: 6,
                }}
              >
                {formatMoney(incomeTotal, currency)}
              </Text>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <Text
                style={{ color: "#9a9a9a", fontWeight: "900", fontSize: 14 }}
              >
                Expense
              </Text>
              <Text
                style={{
                  color: "#FF453A",
                  fontWeight: "900",
                  fontSize: 20,
                  marginTop: 6,
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
            <Text style={{ color: "#9a9a9a", fontWeight: "900", fontSize: 14 }}>
              Net
            </Text>
            <Text style={{ color: "white", fontWeight: "900", fontSize: 18 }}>
              {formatMoney(net, currency)}
            </Text>
          </View>
        </View>

        {/* Mode toggle (keep but smaller via Segmented component if you want) */}
        <View style={{ marginTop: 12 }}>
          <Segmented
            value={mode}
            options={[
              { label: "Expense", value: "expense" },
              { label: "Income", value: "income" },
            ]}
            onChange={setMode}
          />
        </View>

        {/* Top categories */}
        <Text
          style={{
            color: "white",
            fontSize: 18,
            fontWeight: "900",
            marginTop: 16,
            marginBottom: 10,
          }}
        >
          Top Categories
        </Text>

        <View style={{ flexDirection: "row", gap: 12 }}>
          {top3.map((row) => {
            const meta = getCategoryMeta(row.category as any);
            const pct = denom === 0 ? 0 : Math.round((row.total / denom) * 100);

            return (
              <View
                key={row.category}
                style={{
                  flex: 1,
                  backgroundColor: "#0d0d0d",
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: "#151515",
                  padding: 12,
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
                    marginBottom: 10,
                  }}
                >
                  <Ionicons name={meta.icon as any} size={20} color="#fff" />
                </View>

                <Text
                  style={{ color: "white", fontWeight: "900", fontSize: 16 }}
                  numberOfLines={1}
                >
                  {meta.label}
                </Text>

                <Text
                  style={{
                    color: "#bdbdbd",
                    fontWeight: "900",
                    fontSize: 16,
                    marginTop: 8,
                  }}
                >
                  {formatMoney(row.total, currency)}
                </Text>

                <Text
                  style={{
                    color: "#9DFF3A",
                    fontWeight: "900",
                    fontSize: 16,
                    marginTop: 6,
                  }}
                >
                  {pct}%
                </Text>
              </View>
            );
          })}
        </View>

        {/* Breakdown */}
        <Text
          style={{
            color: "white",
            fontSize: 18,
            fontWeight: "900",
            marginTop: 16,
            marginBottom: 10,
          }}
        >
          Breakdown
        </Text>

        <View style={{ gap: 12 }}>
          {byCategory.map((row) => {
            const meta = getCategoryMeta(row.category as any);
            const pct = denom === 0 ? 0 : row.total / denom;
            const pct100 = Math.round(pct * 100);

            return (
              <View
                key={row.category}
                style={{
                  paddingBottom: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "#151515",
                }}
              >
                <View
                  style={{
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
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontWeight: "900",
                          fontSize: 16,
                          flex: 1,
                        }}
                        numberOfLines={1}
                      >
                        {meta.label}
                      </Text>
                      <Text
                        style={{
                          color: "white",
                          fontWeight: "900",
                          fontSize: 16,
                        }}
                      >
                        {formatMoney(row.total, currency)}
                      </Text>
                    </View>

                    <View
                      style={{
                        marginTop: 8,
                        height: 8,
                        borderRadius: 999,
                        backgroundColor: "#1b1b1b",
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          width: `${pct100}%`,
                          height: "100%",
                          backgroundColor: "#9DFF3A",
                        }}
                      />
                    </View>

                    <Text
                      style={{
                        color: "#8b8b8b",
                        fontWeight: "800",
                        marginTop: 6,
                      }}
                    >
                      {row.count} tx • {pct100}%
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
