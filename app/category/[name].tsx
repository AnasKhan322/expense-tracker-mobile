import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import TransactionItem from "../../src/components/transactionItem";
import { useTransactionsStore } from "../../src/store/transactionsStore";
import { formatMoney, totals } from "../../src/utils/money";

export default function CategoryDrilldown() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const categoryName = decodeURIComponent(String(name ?? ""));

  const items = useTransactionsStore((s) => s.transactions);
  const remove = useTransactionsStore((s) => s.remove);

  const filtered = useMemo(
    () => items.filter((t) => t.category === categoryName),
    [items, categoryName],
  );

  const t = useMemo(() => totals(filtered), [filtered]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
      <View style={{ flex: 1, padding: 18 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text
            style={{ color: "white", fontSize: 20, fontWeight: "900" }}
            numberOfLines={1}
          >
            {categoryName}
          </Text>

          <Pressable onPress={() => router.back()}>
            <Text style={{ color: "#9DFF3A", fontWeight: "900" }}>Back</Text>
          </Pressable>
        </View>

        <View
          style={{
            backgroundColor: "#0d0d0d",
            borderRadius: 18,
            padding: 14,
            marginTop: 12,
          }}
        >
          <Text style={{ color: "#aaa" }}>Totals</Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 10,
            }}
          >
            <View>
              <Text style={{ color: "#aaa" }}>Income</Text>
              <Text
                style={{ color: "#34C759", fontWeight: "900", marginTop: 6 }}
              >
                {formatMoney(t.income)}
              </Text>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ color: "#aaa" }}>Expense</Text>
              <Text
                style={{ color: "#FF453A", fontWeight: "900", marginTop: 6 }}
              >
                {formatMoney(t.expense)}
              </Text>
            </View>
          </View>

          <View
            style={{ height: 1, backgroundColor: "#222", marginVertical: 12 }}
          />

          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text style={{ color: "#aaa" }}>Net</Text>
            <Text style={{ color: "white", fontWeight: "900" }}>
              {formatMoney(t.balance)}
            </Text>
          </View>
        </View>

        <Text
          style={{
            color: "white",
            fontWeight: "900",
            marginTop: 14,
            marginBottom: 8,
          }}
        >
          Transactions
        </Text>

        <FlatList
          data={filtered}
          keyExtractor={(x) => x.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <Text style={{ color: "#aaa" }}>
              No transactions in this category.
            </Text>
          }
          renderItem={({ item }) => (
            <TransactionItem
              item={item}
              onSwipeOpen={() => {}}
              onPress={() =>
                router.push({
                  pathname: "/transaction/[id]",
                  params: { id: item.id },
                })
              }
              onEdit={() =>
                router.push({
                  pathname: "/transaction/edit/[id]",
                  params: { id: item.id },
                })
              }
              onDelete={async () => {
                await remove(item.id);
              }}
            />
          )}
        />
      </View>
    </SafeAreaView>
  );
}
