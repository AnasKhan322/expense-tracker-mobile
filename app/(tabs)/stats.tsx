// app/(tabs)/stats.tsx
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Segmented from "../../src/components/segmented";
import { getCategoryMeta } from "../../src/data/categories";
import { useSettingsStore } from "../../src/store/settingsStore";
import { useTransactionsStore } from "../../src/store/transactionsStore";
import type { TransactionType } from "../../src/types/transaction";
import { formatMoney } from "../../src/utils/money";

type RangeKey = "7D" | "30D" | "90D" | "YTD" | "ALL";
type ChartTab = "trend" | "monthly" | "monthDetails";

function startOfYear(d: Date) {
  return new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}
function addMonths(d: Date, months: number) {
  return new Date(d.getFullYear(), d.getMonth() + months, 1, 0, 0, 0, 0);
}
function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
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

function fmtDay(d: Date) {
  // "2 Feb"
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
function fmtMonth(d: Date, withYear: boolean) {
  return d.toLocaleDateString(
    undefined,
    withYear ? { month: "short", year: "2-digit" } : { month: "short" },
  );
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

/**
 * Expense-only buckets with fixed labels:
 * 7D: daily (7)
 * 30D: weekly buckets (5) with short labels like "2 Feb"
 * 90D/YTD/ALL: monthly
 */
function buildExpenseBuckets(range: RangeKey, scoped: any[]) {
  const now = new Date();
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );

  const expenseTx = scoped
    .filter((t) => t.type === "expense")
    .map((t) => ({ ...t, time: new Date(t.date).getTime() }))
    .sort((a, b) => a.time - b.time);

  let start: Date;
  if (range === "ALL") {
    if (expenseTx.length === 0) start = new Date(end);
    else start = new Date(expenseTx[0].time);
    start = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
      0,
      0,
      0,
      0,
    );
  } else if (range === "YTD") {
    start = startOfYear(now);
  } else if (range === "90D") {
    const s = new Date(end);
    s.setDate(s.getDate() - 90);
    start = new Date(s.getFullYear(), s.getMonth(), 1, 0, 0, 0, 0);
  } else if (range === "30D") {
    const s = new Date(end);
    s.setDate(s.getDate() - 30);
    start = new Date(s.getFullYear(), s.getMonth(), s.getDate(), 0, 0, 0, 0);
  } else {
    const s = new Date(end);
    s.setDate(s.getDate() - 7);
    start = new Date(s.getFullYear(), s.getMonth(), s.getDate(), 0, 0, 0, 0);
  }

  type Bucket = { start: Date; end: Date; value: number; label: string };

  let buckets: Bucket[] = [];

  if (range === "7D") {
    buckets = Array.from({ length: 7 }, (_, i) => {
      const s = addDays(start, i);
      const e = addDays(s, 1);
      return { start: s, end: e, value: 0, label: fmtDay(s) };
    });
  } else if (range === "30D") {
    // 5 weekly buckets with short labels
    buckets = Array.from({ length: 5 }, (_, i) => {
      const s = addDays(start, i * 7);
      const e = addDays(s, 7);
      return { start: s, end: e, value: 0, label: fmtDay(s) };
    });
  } else {
    const m0 = startOfMonth(start);
    const mEnd = startOfMonth(end);
    const months: Date[] = [];
    for (let m = new Date(m0); m <= mEnd; m = addMonths(m, 1)) months.push(m);

    const includeYear = range === "ALL" && months.length > 12;
    buckets = months.map((m) => ({
      start: m,
      end: addMonths(m, 1),
      value: 0,
      label: fmtMonth(m, includeYear),
    }));
  }

  for (const tx of expenseTx) {
    const d = new Date(tx.time);
    for (const b of buckets) {
      if (d >= b.start && d < b.end) {
        b.value += tx.amount;
        break;
      }
    }
  }

  const maxY = buckets.reduce((m, b) => Math.max(m, b.value), 0);

  const display = buckets.map((b) => ({
    ...b,
    displayLabel: b.label,
  }));

  return { buckets: display, maxY };
}

export default function Stats() {
  const currency = useSettingsStore((s) => s.currency);
  const transactions = useTransactionsStore((s) => s.transactions);

  const [range, setRange] = useState<RangeKey>("30D");
  const [mode, setMode] = useState<TransactionType>("expense");

  const [chartsOpen, setChartsOpen] = useState(false);
  const [chartTab, setChartTab] = useState<ChartTab>("trend");

  const [monthKeySelected, setMonthKeySelected] = useState<string | null>(null);

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

  const denom = byCategory.reduce((s, x) => s + x.total, 0);

  const expenseSeries = useMemo(
    () => buildExpenseBuckets(range, scoped as any),
    [range, scoped],
  );

  const monthly = useMemo(() => {
    const map = new Map<
      string,
      { key: string; month: Date; income: number; expense: number; tx: any[] }
    >();

    for (const tx of scoped) {
      const d = new Date(tx.date);
      const m = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
      const key = monthKey(m);
      const prev = map.get(key) ?? {
        key,
        month: m,
        income: 0,
        expense: 0,
        tx: [],
      };
      prev.tx.push(tx);
      if (tx.type === "income") prev.income += tx.amount;
      else prev.expense += tx.amount;
      map.set(key, prev);
    }

    const arr = Array.from(map.values()).sort(
      (a, b) => b.month.getTime() - a.month.getTime(),
    );
    const years = new Set(arr.map((x) => x.month.getFullYear()));
    const withYear = years.size > 1;

    return arr.map((x) => ({
      ...x,
      label: x.month.toLocaleDateString(
        undefined,
        withYear ? { month: "short", year: "numeric" } : { month: "long" },
      ),
      net: x.income - x.expense,
    }));
  }, [scoped]);

  const monthDetails = useMemo(() => {
    if (!monthKeySelected) return null;
    const m = monthly.find((x) => x.key === monthKeySelected);
    if (!m) return null;

    const expenseTx = m.tx.filter((t) => t.type === "expense");

    // Top categories (expenses only)
    const map = new Map<string, number>();
    for (const t of expenseTx) {
      map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
    }
    const topCats = Array.from(map.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Top 3 biggest expenses (single transactions)
    const top3Expenses = expenseTx
      .slice()
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

    return { ...m, topCats, top3Expenses };
  }, [monthKeySelected, monthly]);

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

        {/* Range pills */}
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

        {/* Summary card (tap -> charts) */}
        <Pressable
          onPress={() => {
            setMonthKeySelected(null);
            setChartTab("trend");
            setChartsOpen(true);
          }}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        >
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
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: "#9a9a9a", fontWeight: "900", fontSize: 14 }}
              >
                Net
              </Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <Text
                  style={{ color: "white", fontWeight: "900", fontSize: 18 }}
                >
                  {formatMoney(net, currency)}
                </Text>
                <Text style={{ color: "#9DFF3A", fontWeight: "900" }}>
                  Charts
                </Text>
              </View>
            </View>
          </View>
        </Pressable>

        {/* Mode toggle */}
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

        {/* Breakdown list */}
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
              <Pressable
                key={row.category}
                onPress={() =>
                  router.push({
                    pathname: "/category/[name]",
                    params: { name: row.category, mode, range },
                  })
                }
                style={({ pressed }) => ({
                  paddingBottom: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "#151515",
                  opacity: pressed ? 0.7 : 1,
                })}
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
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Charts modal */}
      <Modal
        visible={chartsOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setChartsOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }}>
          <Pressable style={{ flex: 1 }} onPress={() => setChartsOpen(false)} />

          <View
            style={{
              backgroundColor: "#0b0b0b",
              padding: 16,
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              borderWidth: 1,
              borderColor: "#151515",
              maxHeight: "82%",
            }}
          >
            <View
              style={{
                alignSelf: "center",
                width: 48,
                height: 5,
                borderRadius: 999,
                backgroundColor: "#2a2a2a",
                marginBottom: 12,
              }}
            />

            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              {chartTab === "monthDetails" ? (
                <Pressable
                  onPress={() => setChartTab("monthly")}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    marginRight: 6,
                  }}
                >
                  <Text style={{ color: "#9DFF3A", fontWeight: "900" }}>
                    Back
                  </Text>
                </Pressable>
              ) : null}

              <Text
                style={{
                  color: "white",
                  fontWeight: "900",
                  fontSize: 16,
                  flex: 1,
                }}
              >
                {chartTab === "monthDetails"
                  ? (monthDetails?.label ?? "Month")
                  : `Charts • ${range}`}
              </Text>

              <Pressable
                onPress={() => setChartsOpen(false)}
                style={{ paddingVertical: 6, paddingHorizontal: 10 }}
              >
                <Text style={{ color: "#9DFF3A", fontWeight: "900" }}>
                  Close
                </Text>
              </Pressable>
            </View>

            {/* Trend/Monthly toggle (hide when in monthDetails) */}
            {chartTab !== "monthDetails" && (
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
                <Pressable
                  onPress={() => setChartTab("trend")}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 14,
                    backgroundColor:
                      chartTab === "trend" ? "#9DFF3A" : "#141414",
                  }}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      fontWeight: "900",
                      color: chartTab === "trend" ? "#111" : "#bbb",
                    }}
                  >
                    Trend
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setChartTab("monthly")}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 14,
                    backgroundColor:
                      chartTab === "monthly" ? "#9DFF3A" : "#141414",
                  }}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      fontWeight: "900",
                      color: chartTab === "monthly" ? "#111" : "#bbb",
                    }}
                  >
                    Monthly
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Body */}
            {chartTab === "trend" ? (
              <>
                <Text
                  style={{
                    color: "#9a9a9a",
                    fontWeight: "900",
                    marginBottom: 10,
                  }}
                >
                  Expense Trend
                </Text>

                <View
                  style={{
                    backgroundColor: "#0d0d0d",
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: "#151515",
                    padding: 12,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 10,
                    }}
                  >
                    <Text style={{ color: "#FF453A", fontWeight: "900" }}>
                      Expense
                    </Text>
                    <Text style={{ color: "#777", fontWeight: "900" }}>
                      Max: {formatMoney(expenseSeries.maxY, currency)}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-end",
                      gap: 6,
                      height: 120,
                    }}
                  >
                    {expenseSeries.buckets.map((b, idx) => {
                      const maxY = expenseSeries.maxY || 1;
                      const h = Math.max(
                        2,
                        Math.round(clamp01(b.value / maxY) * 110),
                      );

                      return (
                        <View
                          key={idx}
                          style={{ flex: 1, alignItems: "center", gap: 6 }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "flex-end",
                            }}
                          >
                            <View
                              style={{
                                width: 10,
                                height: h,
                                borderRadius: 8,
                                backgroundColor: "#FF453A",
                              }}
                            />
                          </View>

                          <Text
                            style={{
                              color: "#666",
                              fontWeight: "800",
                              fontSize: 10,
                            }}
                            numberOfLines={1}
                          >
                            {b.displayLabel}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                <Text
                  style={{
                    color: "#9a9a9a",
                    fontWeight: "900",
                    marginTop: 16,
                    marginBottom: 10,
                  }}
                >
                  {mode === "expense" ? "Expense" : "Income"} Distribution
                </Text>

                <ScrollView
                  style={{ maxHeight: 260 }}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={{ gap: 12 }}>
                    {byCategory.map((row) => {
                      const meta = getCategoryMeta(row.category as any);
                      const pct = denom === 0 ? 0 : row.total / denom;
                      const pct100 = Math.round(pct * 100);

                      return (
                        <Pressable
                          key={row.category}
                          onPress={() =>
                            router.push({
                              pathname: "/category/[name]",
                              params: { name: row.category, mode, range },
                            })
                          }
                          style={({ pressed }) => ({
                            backgroundColor: "#0d0d0d",
                            borderRadius: 18,
                            borderWidth: 1,
                            borderColor: "#151515",
                            padding: 12,
                            opacity: pressed ? 0.75 : 1,
                          })}
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
                                width: 40,
                                height: 40,
                                borderRadius: 16,
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
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                }}
                              >
                                <Text
                                  style={{
                                    color: "white",
                                    fontWeight: "900",
                                    flex: 1,
                                  }}
                                  numberOfLines={1}
                                >
                                  {meta.label}
                                </Text>
                                <Text
                                  style={{ color: "white", fontWeight: "900" }}
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
                                  color: "#777",
                                  fontWeight: "800",
                                  marginTop: 6,
                                }}
                              >
                                {row.count} tx • {pct100}%
                              </Text>
                            </View>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={{ height: 14 }} />
                </ScrollView>
              </>
            ) : chartTab === "monthly" ? (
              <>
                <Text
                  style={{
                    color: "#9a9a9a",
                    fontWeight: "900",
                    marginBottom: 10,
                  }}
                >
                  Monthly Summary
                </Text>

                {monthly.length === 0 ? (
                  <Text style={{ color: "#777", fontWeight: "800" }}>
                    No data.
                  </Text>
                ) : (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={{ gap: 12 }}>
                      {monthly.map((m) => (
                        <Pressable
                          key={m.key}
                          onPress={() => {
                            setMonthKeySelected(m.key);
                            setChartTab("monthDetails");
                          }}
                          style={({ pressed }) => ({
                            backgroundColor: "#0d0d0d",
                            borderRadius: 18,
                            borderWidth: 1,
                            borderColor: "#151515",
                            padding: 12,
                            opacity: pressed ? 0.75 : 1,
                          })}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                          >
                            <Text
                              style={{
                                color: "white",
                                fontWeight: "900",
                                fontSize: 16,
                                flex: 1,
                              }}
                            >
                              {m.label}
                            </Text>
                            <Ionicons
                              name="chevron-forward"
                              size={18}
                              color="#666"
                            />
                          </View>

                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              marginTop: 10,
                            }}
                          >
                            <Text
                              style={{ color: "#9a9a9a", fontWeight: "900" }}
                            >
                              Income
                            </Text>
                            <Text
                              style={{ color: "#34C759", fontWeight: "900" }}
                            >
                              {formatMoney(m.income, currency)}
                            </Text>
                          </View>

                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              marginTop: 8,
                            }}
                          >
                            <Text
                              style={{ color: "#9a9a9a", fontWeight: "900" }}
                            >
                              Expense
                            </Text>
                            <Text
                              style={{ color: "#FF453A", fontWeight: "900" }}
                            >
                              {formatMoney(m.expense, currency)}
                            </Text>
                          </View>

                          <View
                            style={{
                              height: 1,
                              backgroundColor: "#151515",
                              marginVertical: 12,
                            }}
                          />

                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                            }}
                          >
                            <Text
                              style={{ color: "#9a9a9a", fontWeight: "900" }}
                            >
                              Net
                            </Text>
                            <Text style={{ color: "white", fontWeight: "900" }}>
                              {formatMoney(m.net, currency)}
                            </Text>
                          </View>
                        </Pressable>
                      ))}
                    </View>

                    <View style={{ height: 14 }} />
                  </ScrollView>
                )}
              </>
            ) : (
              <>
                {monthDetails ? (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Summary */}
                    <View
                      style={{
                        backgroundColor: "#0d0d0d",
                        borderRadius: 18,
                        borderWidth: 1,
                        borderColor: "#151515",
                        padding: 12,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                        }}
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
                            }}
                          >
                            {formatMoney(monthDetails.income, currency)}
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
                            }}
                          >
                            {formatMoney(monthDetails.expense, currency)}
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
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text style={{ color: "#9a9a9a", fontWeight: "900" }}>
                          Net
                        </Text>
                        <Text style={{ color: "white", fontWeight: "900" }}>
                          {formatMoney(monthDetails.net, currency)}
                        </Text>
                      </View>
                    </View>

                    {/* Top categories */}
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "900",
                        fontSize: 16,
                        marginTop: 16,
                        marginBottom: 10,
                      }}
                    >
                      Top Spending Categories
                    </Text>

                    <View style={{ gap: 12 }}>
                      {monthDetails.topCats.length === 0 ? (
                        <Text style={{ color: "#777", fontWeight: "800" }}>
                          No expenses.
                        </Text>
                      ) : (
                        monthDetails.topCats.map((c) => {
                          const meta = getCategoryMeta(c.category);
                          return (
                            <Pressable
                              key={c.category}
                              onPress={() => {
                                router.push({
                                  pathname: "/category/[name]",
                                  params: {
                                    name: c.category,
                                    mode: "expense",
                                    range: "ALL",
                                  },
                                });
                              }}
                              style={({ pressed }) => ({
                                backgroundColor: "#0d0d0d",
                                borderRadius: 18,
                                borderWidth: 1,
                                borderColor: "#151515",
                                padding: 12,
                                opacity: pressed ? 0.75 : 1,
                              })}
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
                                    width: 40,
                                    height: 40,
                                    borderRadius: 16,
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

                                <Text
                                  style={{
                                    color: "white",
                                    fontWeight: "900",
                                    flex: 1,
                                  }}
                                  numberOfLines={1}
                                >
                                  {meta.label}
                                </Text>

                                <Text
                                  style={{ color: "white", fontWeight: "900" }}
                                >
                                  {formatMoney(c.total, currency)}
                                </Text>
                              </View>
                            </Pressable>
                          );
                        })
                      )}
                    </View>

                    {/* Top 3 expenses */}
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "900",
                        fontSize: 16,
                        marginTop: 16,
                        marginBottom: 10,
                      }}
                    >
                      Top 3 Biggest Expenses
                    </Text>

                    <View style={{ gap: 12 }}>
                      {monthDetails.top3Expenses.length === 0 ? (
                        <Text style={{ color: "#777", fontWeight: "800" }}>
                          No expenses.
                        </Text>
                      ) : (
                        monthDetails.top3Expenses.map((tx: any) => {
                          const meta = getCategoryMeta(tx.category);
                          return (
                            <Pressable
                              key={tx.id}
                              onPress={() => {
                                router.push({
                                  pathname: "/transaction/[id]",
                                  params: { id: tx.id },
                                });
                              }}
                              style={({ pressed }) => ({
                                backgroundColor: "#0d0d0d",
                                borderRadius: 18,
                                borderWidth: 1,
                                borderColor: "#151515",
                                padding: 12,
                                opacity: pressed ? 0.75 : 1,
                              })}
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
                                    width: 40,
                                    height: 40,
                                    borderRadius: 16,
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
                                    style={{
                                      color: "white",
                                      fontWeight: "900",
                                    }}
                                    numberOfLines={1}
                                  >
                                    {tx.title}
                                  </Text>
                                  <Text
                                    style={{
                                      color: "#777",
                                      fontWeight: "800",
                                      marginTop: 4,
                                    }}
                                  >
                                    {meta.label}
                                  </Text>
                                </View>

                                <Text
                                  style={{
                                    color: "#FF453A",
                                    fontWeight: "900",
                                  }}
                                >
                                  - {formatMoney(tx.amount, currency)}
                                </Text>
                              </View>
                            </Pressable>
                          );
                        })
                      )}
                    </View>

                    <View style={{ height: 14 }} />
                  </ScrollView>
                ) : (
                  <Text style={{ color: "#777", fontWeight: "800" }}>
                    No month selected.
                  </Text>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
