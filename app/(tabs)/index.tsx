// app/(tabs)/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import BalanceCard from "../../src/components/balanceCard";
import CategoryGrid from "../../src/components/categoryGrid";
import FloatingAddButton from "../../src/components/floatingAddButton";
import Segmented from "../../src/components/segmented";
import TransactionItem from "../../src/components/transactionItem";

import {
  getCategoriesForType,
  getCategoryMeta,
} from "../../src/data/categories";
import { useSettingsStore } from "../../src/store/settingsStore";
import { useTransactionsStore } from "../../src/store/transactionsStore";
import { formatMoney, totals } from "../../src/utils/money";

const AFlatList = Animated.createAnimatedComponent(FlatList);

// Categories cache (fast)
const INCOME_CATS = getCategoriesForType("income");
const EXPENSE_CATS = getCategoriesForType("expense");
const ALL_CATS = (() => {
  const map = new Map(INCOME_CATS.concat(EXPENSE_CATS).map((c) => [c.key, c]));
  return Array.from(map.values());
})();

// Collapsing header sizes
const HEADER_EXPANDED = 330;
const HEADER_COLLAPSED = 56;
const COLLAPSE_DISTANCE = HEADER_EXPANDED - HEADER_COLLAPSED;

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

export default function Home() {
  const transactions = useTransactionsStore((s) => s.transactions);
  const remove = useTransactionsStore((s) => s.remove);
  const hydrate = useTransactionsStore((s) => s.hydrate);

  const filters = useTransactionsStore((s) => s.filters);
  const sortKey = useTransactionsStore((s) => s.sortKey);
  const sortDir = useTransactionsStore((s) => s.sortDir);
  const setFilters = useTransactionsStore((s) => s.setFilters);
  const setSort = useTransactionsStore((s) => s.setSort);
  const clearFilters = useTransactionsStore((s) => s.clearFilters);

  const currency = useSettingsStore((s) => s.currency);
  const limits = useSettingsStore((s) => s.limits);

  const openSwipeRef = useRef<any>(null);

  const closeAnyOpenSwipe = useCallback(() => {
    openSwipeRef.current?.close?.();
    openSwipeRef.current = null;
  }, []);

  useFocusEffect(
    useCallback(() => {
      closeAnyOpenSwipe();
      return () => closeAnyOpenSwipe();
    }, [closeAnyOpenSwipe]),
  );

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    closeAnyOpenSwipe();
    setRefreshing(true);
    await hydrate();
    setRefreshing(false);
  }, [hydrate, closeAnyOpenSwipe]);

  // Visible list (filtered + sorted)
  const visible = useMemo(() => {
    const filtered = transactions.filter((t) => {
      if (filters.type !== "all" && t.type !== filters.type) return false;
      if (filters.category !== "all" && t.category !== filters.category)
        return false;
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;

    return filtered.slice().sort((a, b) => {
      if (sortKey === "amount") return (a.amount - b.amount) * dir;
      return (new Date(a.date).getTime() - new Date(b.date).getTime()) * dir;
    });
  }, [transactions, filters, sortKey, sortDir]);

  const t = useMemo(() => totals(visible), [visible]);

  // Bottom sheet
  const [filtersOpen, setFiltersOpen] = useState(false);

  const categories =
    filters.type === "income"
      ? INCOME_CATS
      : filters.type === "expense"
        ? EXPENSE_CATS
        : ALL_CATS;

  const isFiltered =
    filters.type !== "all" ||
    filters.category !== "all" ||
    sortKey !== "date" ||
    sortDir !== "desc";

  // ===== Limits logic (monthly expense spend vs limit) =====
  const monthStart = useMemo(() => startOfMonth(new Date()).getTime(), []);

  const monthExpenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.type !== "expense") continue;
      const time = new Date(tx.date).getTime();
      if (time < monthStart) continue;
      map.set(tx.category, (map.get(tx.category) ?? 0) + tx.amount);
    }
    return map;
  }, [transactions, monthStart]);

  const limitedCategories = useMemo(() => {
    const keys = Object.keys(limits ?? {});
    const valid = keys.filter((k) => {
      const v = (limits as any)?.[k];
      if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) return false;
      // limits should be expense/both categories
      const meta = getCategoryMeta(k);
      return meta.type !== "income";
    });

    return valid
      .map((k) => {
        const limit = (limits as any)[k] as number;
        const spent = monthExpenseByCategory.get(k) ?? 0;
        const ratio = limit > 0 ? spent / limit : 0;
        const left = limit - spent; // negative means over
        return { category: k, limit, spent, ratio, left };
      })
      .sort((a, b) => {
        // closest to limit first (including over)
        if (b.ratio !== a.ratio) return b.ratio - a.ratio;
        return b.spent - a.spent;
      });
  }, [limits, monthExpenseByCategory]);

  const topLimits = limitedCategories.slice(0, 2);

  // Limits popup
  const [limitsOpen, setLimitsOpen] = useState(false);

  // Pinned collapse animation
  const scrollY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const headerHeightStyle = useAnimatedStyle(() => {
    const y = Math.min(scrollY.value, COLLAPSE_DISTANCE);
    const h = interpolate(
      y,
      [0, COLLAPSE_DISTANCE],
      [HEADER_EXPANDED, HEADER_COLLAPSED],
      Extrapolate.CLAMP,
    );
    return { height: h };
  });

  const cardStyle = useAnimatedStyle(() => {
    const y = Math.min(scrollY.value, COLLAPSE_DISTANCE);
    const opacity = interpolate(
      y,
      [0, COLLAPSE_DISTANCE * 0.6],
      [1, 0],
      Extrapolate.CLAMP,
    );
    const scale = interpolate(
      y,
      [0, COLLAPSE_DISTANCE],
      [1, 0.92],
      Extrapolate.CLAMP,
    );
    const translateY = interpolate(
      y,
      [0, COLLAPSE_DISTANCE],
      [0, -10],
      Extrapolate.CLAMP,
    );
    return { opacity, transform: [{ translateY }, { scale }] };
  });

  const compactStyle = useAnimatedStyle(() => {
    const y = Math.min(scrollY.value, COLLAPSE_DISTANCE);
    const opacity = interpolate(
      y,
      [COLLAPSE_DISTANCE * 0.35, COLLAPSE_DISTANCE],
      [0, 1],
      Extrapolate.CLAMP,
    );
    const translateY = interpolate(
      y,
      [COLLAPSE_DISTANCE * 0.35, COLLAPSE_DISTANCE],
      [10, 0],
      Extrapolate.CLAMP,
    );
    return { opacity, transform: [{ translateY }] };
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
      <View style={{ flex: 1 }}>
        {/* Pinned header: title + icons */}
        <View style={{ paddingHorizontal: 18 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 12,
              marginBottom: 10,
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 22,
                fontWeight: "900",
                flex: 1,
              }}
            >
              Your Finances
            </Text>

            <Pressable
              onPress={() => {
                closeAnyOpenSwipe();
                setFiltersOpen(true);
              }}
              style={{ padding: 10, marginRight: 6 }}
              hitSlop={10}
            >
              <View>
                <Ionicons name="funnel" size={20} color="#fff" />
                {isFiltered && (
                  <View
                    style={{
                      position: "absolute",
                      right: -1,
                      top: -1,
                      width: 8,
                      height: 8,
                      borderRadius: 99,
                      backgroundColor: "#9DFF3A",
                    }}
                  />
                )}
              </View>
            </Pressable>

            <Pressable
              onPress={() => {
                closeAnyOpenSwipe();
                router.push("/settings");
              }}
              style={{ padding: 10 }}
              hitSlop={10}
            >
              <Ionicons name="settings-outline" size={22} color="#fff" />
            </Pressable>
          </View>

          {/* Pinned collapsing area */}
          <Animated.View
            style={[
              { overflow: "hidden", position: "relative" },
              headerHeightStyle,
            ]}
          >
            {/* Big card stack */}
            <Animated.View
              style={[
                cardStyle,
                { position: "absolute", left: 0, right: 0, top: 0 },
              ]}
            >
              {/* Balance */}
              <Pressable
                onPress={() => {
                  closeAnyOpenSwipe();
                  router.push("/balance");
                }}
              >
                <View style={{ paddingBottom: 12 }}>
                  <BalanceCard
                    balance={t.balance}
                    income={t.income}
                    expense={t.expense}
                  />
                </View>
              </Pressable>

              {/* Limits preview card */}
              <Pressable
                onPress={() => {
                  closeAnyOpenSwipe();
                  setLimitsOpen(true);
                }}
                style={({ pressed }) => ({
                  backgroundColor: "#0d0d0d",
                  borderRadius: 18,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: "#151515",
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text
                    style={{
                      color: "white",
                      fontWeight: "900",
                      fontSize: 16,
                      flex: 1,
                    }}
                  >
                    Limits
                  </Text>
                  <Text style={{ color: "#9DFF3A", fontWeight: "900" }}>
                    View
                  </Text>
                </View>

                {limitedCategories.length === 0 ? (
                  <Text
                    style={{ color: "#777", fontWeight: "800", marginTop: 8 }}
                  >
                    No limits set. Tap to add limits.
                  </Text>
                ) : (
                  <View style={{ marginTop: 10, gap: 10 }}>
                    {topLimits.map((row) => {
                      const meta = getCategoryMeta(row.category);
                      const pct =
                        row.limit > 0 ? Math.min(1, row.spent / row.limit) : 0;
                      const pct100 =
                        row.limit > 0
                          ? Math.round((row.spent / row.limit) * 100)
                          : 0;
                      const over = row.spent > row.limit;

                      return (
                        <View
                          key={row.category}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <View
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 14,
                              backgroundColor: meta.color,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Ionicons
                              name={meta.icon as any}
                              size={16}
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
                                style={{
                                  color: over ? "#FF453A" : "#bbb",
                                  fontWeight: "900",
                                }}
                              >
                                {over
                                  ? `Over ${formatMoney(Math.abs(row.left), currency)}`
                                  : `${formatMoney(row.left, currency)} left`}
                              </Text>
                            </View>

                            <View
                              style={{
                                marginTop: 6,
                                height: 7,
                                borderRadius: 999,
                                backgroundColor: "#1b1b1b",
                                overflow: "hidden",
                              }}
                            >
                              <View
                                style={{
                                  width: `${Math.round(pct * 100)}%`,
                                  height: "100%",
                                  backgroundColor: over ? "#FF453A" : "#9DFF3A",
                                }}
                              />
                            </View>

                            <Text
                              style={{
                                color: "#777",
                                fontWeight: "800",
                                marginTop: 5,
                              }}
                            >
                              {formatMoney(row.spent, currency)} /{" "}
                              {formatMoney(row.limit, currency)} • {pct100}%
                            </Text>
                          </View>
                        </View>
                      );
                    })}

                    {limitedCategories.length > 3 && (
                      <Text
                        style={{
                          color: "#777",
                          fontWeight: "800",
                          marginTop: 2,
                        }}
                      >
                        +{limitedCategories.length - 3} more
                      </Text>
                    )}
                  </View>
                )}
              </Pressable>
            </Animated.View>

            {/* Compact bar pinned to bottom */}
            <Animated.View
              style={[
                compactStyle,
                { position: "absolute", left: 0, right: 0, bottom: 0 },
              ]}
            >
              <Pressable
                onPress={() => {
                  closeAnyOpenSwipe();
                  router.push("/balance");
                }}
                style={{
                  backgroundColor: "#0d0d0d",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#151515",
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Text style={{ color: "#bbb", fontWeight: "900" }}>
                  Balance
                </Text>
                <Text
                  style={{ color: "white", fontWeight: "900", flex: 1 }}
                  numberOfLines={1}
                >
                  {formatMoney(t.balance, currency)}
                </Text>
                <Text style={{ color: "#777", fontWeight: "900" }}>
                  Details
                </Text>
              </Pressable>
            </Animated.View>
          </Animated.View>

          <Text
            style={{
              color: "white",
              fontSize: 16,
              fontWeight: "900",
              marginTop: 8,
              marginBottom: 10,
            }}
          >
            Transactions
          </Text>
        </View>

        {/* List */}
        <AFlatList
          data={visible}
          keyExtractor={(x: any) => x.id}
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 110 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onScroll={onScroll}
          scrollEventThrottle={16}
          onScrollBeginDrag={closeAnyOpenSwipe}
          ListEmptyComponent={
            <Text style={{ color: "#aaa", paddingHorizontal: 18 }}>
              No transactions yet.
            </Text>
          }
          renderItem={({ item }: any) => (
            <TransactionItem
              item={item}
              onSwipeOpen={(ref) => {
                if (openSwipeRef.current && openSwipeRef.current !== ref) {
                  openSwipeRef.current.close?.();
                }
                openSwipeRef.current = ref;
              }}
              onPress={() => {
                closeAnyOpenSwipe();
                router.push({
                  pathname: "/transaction/[id]",
                  params: { id: item.id },
                });
              }}
              onEdit={() => {
                closeAnyOpenSwipe();
                router.push({
                  pathname: "/transaction/edit/[id]",
                  params: { id: item.id },
                });
              }}
              onDelete={async () => {
                await remove(item.id);
                closeAnyOpenSwipe();
              }}
            />
          )}
        />

        {/* Limits popup (bottom sheet) */}
        <Modal
          visible={limitsOpen}
          animationType="slide"
          transparent
          onRequestClose={() => setLimitsOpen(false)}
        >
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }}>
            <Pressable
              style={{ flex: 1 }}
              onPress={() => setLimitsOpen(false)}
            />

            <View
              style={{
                backgroundColor: "#0b0b0b",
                padding: 16,
                borderTopLeftRadius: 22,
                borderTopRightRadius: 22,
                borderWidth: 1,
                borderColor: "#151515",
                maxHeight: "78%",
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

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{ color: "white", fontWeight: "900", fontSize: 16 }}
                >
                  Your Limits
                </Text>

                <Pressable
                  onPress={() => {
                    setLimitsOpen(false);
                    router.push("/limits");
                  }}
                  style={{
                    marginLeft: "auto",
                    paddingVertical: 8,
                    paddingHorizontal: 10,
                  }}
                >
                  <Text style={{ color: "#9DFF3A", fontWeight: "900" }}>
                    Manage
                  </Text>
                </Pressable>
              </View>

              {limitedCategories.length === 0 ? (
                <View style={{ paddingVertical: 18 }}>
                  <Text style={{ color: "#bbb", fontWeight: "900" }}>
                    No limits set.
                  </Text>
                  <Text
                    style={{ color: "#666", fontWeight: "800", marginTop: 6 }}
                  >
                    Tap “Manage” to add category limits.
                  </Text>
                </View>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={{ gap: 12 }}>
                    {limitedCategories.map((row) => {
                      const meta = getCategoryMeta(row.category);
                      const pct =
                        row.limit > 0 ? Math.min(1, row.spent / row.limit) : 0;
                      const pct100 =
                        row.limit > 0
                          ? Math.round((row.spent / row.limit) * 100)
                          : 0;
                      const over = row.spent > row.limit;

                      return (
                        <View
                          key={row.category}
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
                              <Ionicons
                                name={meta.icon as any}
                                size={20}
                                color="#fff"
                              />
                            </View>

                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  color: "white",
                                  fontWeight: "900",
                                  fontSize: 16,
                                }}
                              >
                                {meta.label}
                              </Text>

                              <Text
                                style={{
                                  color: over ? "#FF453A" : "#bdbdbd",
                                  fontWeight: "900",
                                  marginTop: 6,
                                }}
                              >
                                {formatMoney(row.spent, currency)} /{" "}
                                {formatMoney(row.limit, currency)}
                                {"  "}
                                <Text style={{ color: "#777" }}>
                                  • {pct100}%
                                </Text>
                              </Text>
                            </View>
                          </View>

                          <View
                            style={{
                              marginTop: 10,
                              height: 8,
                              borderRadius: 999,
                              backgroundColor: "#1b1b1b",
                              overflow: "hidden",
                            }}
                          >
                            <View
                              style={{
                                width: `${Math.round(pct * 100)}%`,
                                height: "100%",
                                backgroundColor: over ? "#FF453A" : "#9DFF3A",
                              }}
                            />
                          </View>

                          <Text
                            style={{
                              color: over ? "#FF453A" : "#8b8b8b",
                              fontWeight: "800",
                              marginTop: 8,
                            }}
                          >
                            {over
                              ? `Over by ${formatMoney(Math.abs(row.left), currency)}`
                              : `${formatMoney(row.left, currency)} left`}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  <View style={{ height: 14 }} />
                </ScrollView>
              )}

              <Pressable
                onPress={() => setLimitsOpen(false)}
                style={{
                  marginTop: 14,
                  paddingVertical: 14,
                  borderRadius: 16,
                  backgroundColor: "#141414",
                  borderWidth: 1,
                  borderColor: "#222",
                }}
              >
                <Text
                  style={{
                    textAlign: "center",
                    fontWeight: "900",
                    color: "#bbb",
                  }}
                >
                  Close
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Filters sheet */}
        <Modal
          visible={filtersOpen}
          animationType="slide"
          transparent
          onRequestClose={() => setFiltersOpen(false)}
        >
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }}>
            <Pressable
              style={{ flex: 1 }}
              onPress={() => setFiltersOpen(false)}
            />

            <View
              style={{
                backgroundColor: "#0b0b0b",
                padding: 16,
                borderTopLeftRadius: 22,
                borderTopRightRadius: 22,
                borderWidth: 1,
                borderColor: "#151515",
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

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{ color: "white", fontWeight: "900", fontSize: 16 }}
                >
                  Filters & Sorting
                </Text>

                <Pressable
                  onPress={() => {
                    clearFilters();
                    setSort("date", "desc");
                  }}
                  style={{
                    marginLeft: "auto",
                    paddingVertical: 8,
                    paddingHorizontal: 10,
                  }}
                >
                  <Text style={{ color: "#9DFF3A", fontWeight: "900" }}>
                    Reset
                  </Text>
                </Pressable>
              </View>

              <Text
                style={{ color: "#9a9a9a", fontWeight: "900", marginBottom: 8 }}
              >
                Type
              </Text>
              <Segmented
                value={filters.type}
                options={[
                  { label: "All", value: "all" },
                  { label: "Income", value: "income" },
                  { label: "Expense", value: "expense" },
                ]}
                onChange={(v) => setFilters({ type: v, category: "all" })}
              />

              <View style={{ height: 14 }} />

              <Text
                style={{ color: "#9a9a9a", fontWeight: "900", marginBottom: 8 }}
              >
                Sort
              </Text>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={() => setSort("date", sortDir)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: sortKey === "date" ? "#9DFF3A" : "#1b1b1b",
                    backgroundColor: "#0d0d0d",
                  }}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      fontWeight: "900",
                      color: sortKey === "date" ? "#9DFF3A" : "white",
                    }}
                  >
                    Date
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setSort("amount", sortDir)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: sortKey === "amount" ? "#9DFF3A" : "#1b1b1b",
                    backgroundColor: "#0d0d0d",
                  }}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      fontWeight: "900",
                      color: sortKey === "amount" ? "#9DFF3A" : "white",
                    }}
                  >
                    Amount
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    setSort(sortKey, sortDir === "desc" ? "asc" : "desc")
                  }
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#1b1b1b",
                    backgroundColor: "#0d0d0d",
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "900" }}>
                    {sortDir === "desc" ? "↓" : "↑"}
                  </Text>
                </Pressable>
              </View>

              <View style={{ height: 14 }} />

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: "#9a9a9a", fontWeight: "900" }}>
                  Category
                </Text>

                <Pressable
                  onPress={() => setFilters({ category: "all" })}
                  style={{
                    marginLeft: "auto",
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                  }}
                >
                  <Text style={{ color: "#9DFF3A", fontWeight: "900" }}>
                    All
                  </Text>
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 360 }}
              >
                <CategoryGrid
                  categories={categories}
                  selected={filters.category}
                  onSelect={(id) => setFilters({ category: id })}
                />
              </ScrollView>

              <Pressable
                onPress={() => setFiltersOpen(false)}
                style={{
                  marginTop: 14,
                  paddingVertical: 14,
                  borderRadius: 16,
                  backgroundColor: "#9DFF3A",
                }}
              >
                <Text
                  style={{
                    textAlign: "center",
                    fontWeight: "900",
                    color: "#111",
                  }}
                >
                  Done
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <FloatingAddButton
          onPress={() => {
            closeAnyOpenSwipe();
            router.push("/add");
          }}
        />
      </View>
    </SafeAreaView>
  );
}
