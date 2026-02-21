import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";
import Segmented from "../../src/components/segmented";
import { getCategoryMeta } from "../../src/data/categories";
import { getTransactions } from "../../src/storage/transactionStorage";
import { Transaction } from "../../src/types/transaction";
import { formatMoney } from "../../src/utils/money";
import {
  filterByRange,
  groupByCategory,
  RangeKey,
  sumExpense,
  sumIncome,
} from "../../src/utils/stats";

type Mode = "expense" | "income";

export default function Stats() {
  const [items, setItems] = useState<Transaction[]>([]);
  const [range, setRange] = useState<RangeKey>("30d");
  const [mode, setMode] = useState<Mode>("expense");

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

  const filtered = useMemo(() => filterByRange(items, range), [items, range]);

  const income = useMemo(() => sumIncome(filtered), [filtered]);
  const expense = useMemo(() => sumExpense(filtered), [filtered]);
  const balance = income - expense;

  const byCategory = useMemo(
    () => groupByCategory(filtered, mode),
    [filtered, mode],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
      <View style={{ flex: 1, padding: 18 }}>
        <Text
          style={{
            color: "white",
            fontSize: 22,
            fontWeight: "900",
            marginBottom: 14,
          }}
        >
          Stats
        </Text>

        {/* Range */}
        <Segmented<RangeKey>
          value={range}
          onChange={setRange}
          options={[
            { label: "7D", value: "7d" },
            { label: "30D", value: "30d" },
            { label: "90D", value: "90d" },
            { label: "All", value: "all" },
          ]}
        />

        {/* Summary card */}
        <View
          style={{
            backgroundColor: "#111",
            borderRadius: 18,
            padding: 16,
            marginTop: 14,
            marginBottom: 14,
          }}
        >
          <Text style={{ color: "#aaa", marginBottom: 8 }}>Overview</Text>

          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View>
              <Text style={{ color: "#bbb" }}>Income</Text>
              <Text
                style={{
                  color: "#34C759",
                  fontWeight: "900",
                  fontSize: 18,
                  marginTop: 4,
                }}
              >
                {formatMoney(income)}
              </Text>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ color: "#bbb" }}>Expense</Text>
              <Text
                style={{
                  color: "#FF453A",
                  fontWeight: "900",
                  fontSize: 18,
                  marginTop: 4,
                }}
              >
                {formatMoney(expense)}
              </Text>
            </View>
          </View>

          <View
            style={{ height: 1, backgroundColor: "#222", marginVertical: 14 }}
          />

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#bbb" }}>Balance</Text>
            <Text style={{ color: "white", fontWeight: "900", fontSize: 18 }}>
              {formatMoney(balance)}
            </Text>
          </View>
        </View>

        {/* Income/Expense toggle */}
        <Segmented<Mode>
          value={mode}
          onChange={setMode}
          options={[
            { label: "Expense", value: "expense" },
            { label: "Income", value: "income" },
          ]}
        />

        <Text
          style={{
            color: "white",
            fontSize: 16,
            fontWeight: "900",
            marginTop: 14,
            marginBottom: 10,
          }}
        >
          By Category
        </Text>

        <FlatList
          data={byCategory}
          keyExtractor={(x) => x.category}
          ListEmptyComponent={
            <Text style={{ color: "#aaa" }}>No data for this range.</Text>
          }
          renderItem={({ item }) => {
            const meta = getCategoryMeta(item.category);
            return (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "#222",
                }}
              >
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    backgroundColor: meta.color,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Ionicons name={meta.icon as any} size={18} color="white" />
                </View>

                <Text style={{ color: "white", fontWeight: "800", flex: 1 }}>
                  {item.category}
                </Text>

                <Text style={{ color: "white", fontWeight: "900" }}>
                  {formatMoney(item.total)}
                </Text>
              </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}
