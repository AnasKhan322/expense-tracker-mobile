import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, FlatList, Text, View } from "react-native";

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

  const t = totals(items);

  return (
    <View style={{ flex: 1, backgroundColor: "#000", padding: 18 }}>
      <Text style={{ color: "#888", marginBottom: 4 }}>Hello,</Text>
      <Text
        style={{
          color: "white",
          fontSize: 22,
          fontWeight: "800",
          marginBottom: 16,
        }}
      >
        Your Finances
      </Text>

      <BalanceCard balance={t.balance} income={t.income} expense={t.expense} />

      <Text
        style={{
          color: "white",
          fontSize: 16,
          fontWeight: "800",
          marginBottom: 10,
        }}
      >
        Recent Transactions
      </Text>

      <FlatList
        data={items}
        keyExtractor={(x) => x.id}
        renderItem={({ item }) => (
          <TransactionItem
            item={item}
            onLongPress={() => {
              Alert.alert("Delete transaction?", "This cannot be undone.", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: async () => {
                    const next = await deleteTransaction(item.id);
                    setItems(next);
                  },
                },
              ]);
            }}
          />
        )}
        ListEmptyComponent={
          <Text style={{ color: "#aaa" }}>No transactions yet.</Text>
        }
      />

      <FloatingAddButton onPress={() => router.push("/add")} />
    </View>
  );
}
