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

import BalanceCard from "../../src/components/balanceCard";
import CategoryGrid from "../../src/components/categoryGrid";
import FloatingAddButton from "../../src/components/floatingAddButton";
import Segmented from "../../src/components/segmented";
import TransactionItem from "../../src/components/transactionItem";

import { getCategoriesForType } from "../../src/data/categories";
import { useTransactionsStore } from "../../src/store/transactionsStore";
import { totals } from "../../src/utils/money";

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

  // ✅ compute categories safely (not at module scope)
  const incomeCats = useMemo(() => getCategoriesForType("income"), []);
  const expenseCats = useMemo(() => getCategoriesForType("expense"), []);
  const allCats = useMemo(() => {
    const map = new Map(incomeCats.concat(expenseCats).map((c) => [c.key, c]));
    return Array.from(map.values());
  }, [incomeCats, expenseCats]);

  const categories =
    filters.type === "income"
      ? incomeCats
      : filters.type === "expense"
        ? expenseCats
        : allCats;

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

  const isFiltered =
    filters.type !== "all" ||
    filters.category !== "all" ||
    sortKey !== "date" ||
    sortDir !== "desc";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
      <View style={{ flex: 1, padding: 18 }}>
        {/* Header row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text
            style={{ color: "white", fontSize: 22, fontWeight: "900", flex: 1 }}
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

        <Pressable
          onPress={() => {
            closeAnyOpenSwipe();
            router.push("/balance");
          }}
        >
          <BalanceCard
            balance={t.balance}
            income={t.income}
            expense={t.expense}
          />
        </Pressable>

        <Text
          style={{
            color: "white",
            fontSize: 16,
            fontWeight: "900",
            marginTop: 14,
            marginBottom: 10,
          }}
        >
          Transactions
        </Text>

        <FlatList
          data={visible}
          keyExtractor={(x) => x.id}
          contentContainerStyle={{ paddingBottom: 110 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onScrollBeginDrag={closeAnyOpenSwipe}
          ListEmptyComponent={
            <Text style={{ color: "#aaa" }}>No transactions yet.</Text>
          }
          renderItem={({ item }) => (
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
      </View>

      {/* Bottom sheet */}
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
              <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>
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
                <Text style={{ color: "#9DFF3A", fontWeight: "900" }}>All</Text>
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
    </SafeAreaView>
  );
}
