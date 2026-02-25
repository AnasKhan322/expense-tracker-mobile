import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCategoryMeta } from "../../src/data/categories";
import { useTransactionsStore } from "../../src/store/transactionsStore";
import { formatMoney } from "../../src/utils/money";
import {
  filterByRange,
  groupByCategory,
  RangeKey,
  sumExpense,
  sumIncome,
} from "../../src/utils/stats";

type Mode = "expense" | "income";

const ranges: { label: string; value: RangeKey }[] = [
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "90D", value: "90d" },
  { label: "YTD", value: "ytd" },
  { label: "All", value: "all" },
];

export default function Stats() {
  const items = useTransactionsStore((s) => s.transactions);

  const [range, setRange] = useState<RangeKey>("30d");
  const [mode, setMode] = useState<Mode>("expense");

  const filtered = useMemo(() => filterByRange(items, range), [items, range]);

  const income = useMemo(() => sumIncome(filtered), [filtered]);
  const expense = useMemo(() => sumExpense(filtered), [filtered]);
  const net = income - expense;

  const byCategory = useMemo(
    () => groupByCategory(filtered, mode),
    [filtered, mode],
  );

  const totalForMode = useMemo(
    () => byCategory.reduce((a, x) => a + x.total, 0),
    [byCategory],
  );

  const top3 = byCategory.slice(0, 3);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
      <View style={{ flex: 1, padding: 18 }}>
        <Text style={styles.title}>Stats</Text>

        {/* Range Selector */}
        <View style={styles.pillRow}>
          {ranges.map((r) => {
            const active = r.value === range;
            return (
              <Pressable
                key={r.value}
                onPress={() => setRange(r.value)}
                style={[styles.pill, active && styles.pillActive]}
              >
                <Text
                  style={[styles.pillText, active && styles.pillTextActive]}
                >
                  {r.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.muted}>Income</Text>
              <Text style={[styles.big, { color: "#34C759" }]}>
                {formatMoney(income)}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.muted}>Expense</Text>
              <Text style={[styles.big, { color: "#FF453A" }]}>
                {formatMoney(expense)}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.muted}>Net</Text>
            <Text style={[styles.big, { color: "white" }]}>
              {formatMoney(net)}
            </Text>
          </View>
        </View>

        {/* Mode Toggle */}
        <View style={styles.modeRow}>
          <Pressable
            onPress={() => setMode("expense")}
            style={[styles.modeBtn, mode === "expense" && styles.modeBtnActive]}
          >
            <Text
              style={[
                styles.modeText,
                mode === "expense" && styles.modeTextActive,
              ]}
            >
              Expense
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setMode("income")}
            style={[styles.modeBtn, mode === "income" && styles.modeBtnActive]}
          >
            <Text
              style={[
                styles.modeText,
                mode === "income" && styles.modeTextActive,
              ]}
            >
              Income
            </Text>
          </Pressable>
        </View>

        {/* Top Categories */}
        <Text style={[styles.sectionTitle, { marginTop: 14 }]}>
          Top Categories
        </Text>

        <View style={styles.topRow}>
          {top3.length === 0 ? (
            <Text style={{ color: "#aaa" }}>No data.</Text>
          ) : (
            top3.map((x) => {
              const meta = getCategoryMeta(x.category);
              const pct =
                totalForMode > 0
                  ? Math.round((x.total / totalForMode) * 100)
                  : 0;

              return (
                <Pressable
                  key={x.category}
                  onPress={() =>
                    router.push({
                      pathname: "/category/[name]",
                      params: { name: x.category },
                    })
                  }
                  style={styles.topCard}
                >
                  <View
                    style={[styles.topIcon, { backgroundColor: meta.color }]}
                  >
                    <Ionicons name={meta.icon as any} size={18} color="#fff" />
                  </View>

                  <Text style={styles.topCat} numberOfLines={1}>
                    {x.category}
                  </Text>
                  <Text style={styles.topVal}>{formatMoney(x.total)}</Text>
                  <Text style={styles.topPct}>{pct}%</Text>
                </Pressable>
              );
            })
          )}
        </View>

        {/* Breakdown */}
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Breakdown</Text>

        <FlatList
          data={byCategory}
          keyExtractor={(x) => x.category}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <Text style={{ color: "#aaa" }}>
              No transactions in this range.
            </Text>
          }
          renderItem={({ item }) => {
            const meta = getCategoryMeta(item.category);
            const pct = totalForMode > 0 ? item.total / totalForMode : 0;

            return (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/category/[name]",
                    params: { name: item.category },
                  })
                }
                style={styles.row}
              >
                <View style={[styles.icon, { backgroundColor: meta.color }]}>
                  <Ionicons name={meta.icon as any} size={18} color="#fff" />
                </View>

                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={styles.rowTitle}>{item.category}</Text>
                    <Text style={styles.rowAmt}>{formatMoney(item.total)}</Text>
                  </View>

                  <View style={styles.barBg}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${Math.round(pct * 100)}%`,
                        },
                      ]}
                    />
                  </View>

                  <Text style={styles.rowMeta}>
                    {item.count} tx • {Math.round(pct * 100)}%
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    color: "white",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 12,
  },
  pillRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#141414",
  },
  pillActive: { backgroundColor: "#9DFF3A" },
  pillText: {
    color: "#cfcfcf",
    fontWeight: "800",
    fontSize: 12,
  },
  pillTextActive: { color: "#111" },

  summaryCard: {
    backgroundColor: "#0d0d0d",
    borderRadius: 18,
    padding: 16,
    marginTop: 14,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  muted: { color: "#aaa", fontWeight: "700" },
  big: { fontSize: 18, fontWeight: "900", marginTop: 6 },
  divider: {
    height: 1,
    backgroundColor: "#1f1f1f",
    marginVertical: 14,
  },

  modeRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#141414",
  },
  modeBtnActive: {
    backgroundColor: "#1f1f1f",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  modeText: {
    textAlign: "center",
    color: "#cfcfcf",
    fontWeight: "900",
  },
  modeTextActive: { color: "white" },

  sectionTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 10,
  },

  topRow: { flexDirection: "row", gap: 10 },
  topCard: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    borderRadius: 16,
    padding: 12,
  },
  topIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  topCat: { color: "white", fontWeight: "900" },
  topVal: { color: "#cfcfcf", marginTop: 6, fontWeight: "800" },
  topPct: { color: "#9DFF3A", marginTop: 2, fontWeight: "900" },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { color: "white", fontWeight: "900" },
  rowAmt: { color: "white", fontWeight: "900" },
  barBg: {
    height: 8,
    backgroundColor: "#1a1a1a",
    borderRadius: 999,
    marginTop: 8,
    overflow: "hidden",
  },
  barFill: { height: 8, backgroundColor: "#9DFF3A" },
  rowMeta: {
    color: "#8b8b8b",
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
  },
});
