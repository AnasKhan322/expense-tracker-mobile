import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useRef } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BalanceCard from "../../src/components/balanceCard";
import FloatingAddButton from "../../src/components/floatingAddButton";
import TransactionItem from "../../src/components/transactionItem";
import { useTransactionsStore } from "../../src/store/transactionsStore";

import { totals } from "../../src/utils/money";

export default function Home() {
  const items = useTransactionsStore((s) => s.transactions);
  const remove = useTransactionsStore((s) => s.remove);

  const openSwipeRef = useRef<any>(null);
  const closeAnyOpenSwipe = useCallback(() => {
    openSwipeRef.current?.close?.();
    openSwipeRef.current = null;
  }, []);

  useFocusEffect(
    useCallback(() => {
      closeAnyOpenSwipe();
      return () => {};
    }, [closeAnyOpenSwipe]),
  );

  const t = useMemo(() => totals(items), [items]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
      <View style={{ flex: 1, padding: 18 }}>
        <Text
          style={{
            color: "white",
            fontSize: 22,
            fontWeight: "900",
            marginBottom: 16,
          }}
        >
          Your Finances
        </Text>

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
            marginBottom: 10,
          }}
        >
          Recent Transactions
        </Text>

        <FlatList
          data={items}
          keyExtractor={(x) => x.id}
          contentContainerStyle={{ paddingBottom: 90 }}
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

      <FloatingAddButton
        onPress={() => {
          closeAnyOpenSwipe();
          router.push("/add");
        }}
      />
    </SafeAreaView>
  );
}
