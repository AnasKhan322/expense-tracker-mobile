import { router } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Donut from "../src/components/donut";
import { useTransactionsStore } from "../src/store/transactionsStore";
import { formatMoney, totals } from "../src/utils/money";

export default function BalanceScreen() {
  const items = useTransactionsStore((s) => s.transactions);
  const t = useMemo(() => totals(items), [items]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
      <View style={{ flex: 1, padding: 18 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <Text style={{ color: "white", fontSize: 20, fontWeight: "900" }}>
            Financial Overview
          </Text>

          <Pressable onPress={() => router.back()}>
            <Text style={{ color: "#9DFF3A", fontWeight: "800" }}>Close</Text>
          </Pressable>
        </View>

        <View
          style={{
            backgroundColor: "#0d0d0d",
            borderRadius: 18,
            padding: 18,
            alignItems: "center",
          }}
        >
          <Donut income={t.income} expense={t.expense} />

          <View
            style={{ position: "absolute", top: 115, alignItems: "center" }}
          >
            <Text style={{ color: "#aaa" }}>Total Balance</Text>
            <Text style={{ color: "white", fontSize: 26, fontWeight: "900" }}>
              {formatMoney(t.balance)}
            </Text>
          </View>

          <View
            style={{
              width: "100%",
              marginTop: 18,
              flexDirection: "row",
              justifyContent: "space-between",
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
        </View>
      </View>
    </SafeAreaView>
  );
}
