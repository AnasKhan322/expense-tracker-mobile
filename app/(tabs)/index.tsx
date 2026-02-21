import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  deleteTransaction,
  getTransactions,
} from "../../src/storage/transactionStorage";
import { Transaction } from "../../src/types/transaction";
import { totals } from "../../src/utils/money";

import BalanceCard from "../../src/components/balanceCard";
import FloatingAddButton from "../../src/components/floatingAddButton";
import TransactionItem from "../../src/components/transactionItem";

export default function Home() {
  const [items, setItems] = useState<Transaction[]>([]);

  const load = useCallback(async () => {
    const data = await getTransactions();
    setItems(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      return () => {};
    }, [load]),
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

        {/* Balance card is tappable -> Overview donut */}
        <Pressable onPress={() => router.push("/balance")}>
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
                const next = await deleteTransaction(item.id);
                setItems(next);
              }}
            />
          )}
        />
      </View>

      <FloatingAddButton onPress={() => router.push("/add")} />
    </SafeAreaView>
  );
}
