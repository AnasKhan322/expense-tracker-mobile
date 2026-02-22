import { router } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Donut from "../../src/components/donut";
import { useTransactionsStore } from "../../src/store/transactionsStore";
import { formatMoney, totals } from "../../src/utils/money";

export default function BalanceOverview() {
  const items = useTransactionsStore((s) => s.transactions);
  const t = useMemo(() => totals(items), [items]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
      <View style={{ padding: 18 }}>
        <Text
          style={{
            color: "white",
            fontSize: 22,
            fontWeight: "900",
            marginBottom: 14,
          }}
        >
          Financial Overview
        </Text>

        <View
          style={{
            backgroundColor: "#111",
            borderRadius: 22,
            padding: 18,
            alignItems: "center",
          }}
        >
          <View
            style={{
              position: "relative",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Donut income={t.income} expense={t.expense} />

            <View style={{ position: "absolute", alignItems: "center" }}>
              <Text style={{ color: "#aaa", fontWeight: "700" }}>
                Total Balance
              </Text>
              <Text
                style={{
                  color: "white",
                  fontSize: 28,
                  fontWeight: "900",
                  marginTop: 6,
                }}
              >
                {formatMoney(t.balance)}
              </Text>
            </View>
          </View>

          <View style={{ width: "100%", marginTop: 18 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <Text style={{ color: "#34C759", fontWeight: "900" }}>
                Income
              </Text>
              <Text style={{ color: "white", fontWeight: "900" }}>
                {formatMoney(t.income)}
              </Text>
            </View>

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
              <Text style={{ color: "white", fontWeight: "900" }}>
                {formatMoney(t.expense)}
              </Text>
            </View>

            <View
              style={{ height: 1, backgroundColor: "#222", marginVertical: 10 }}
            />

            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ color: "#9DFF3A", fontWeight: "900" }}>
                Balance
              </Text>
              <Text style={{ color: "white", fontWeight: "900" }}>
                {formatMoney(t.balance)}
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => router.back()}
          style={{ padding: 12, marginTop: 10 }}
        >
          <Text style={{ color: "#aaa", textAlign: "center" }}>Close</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
