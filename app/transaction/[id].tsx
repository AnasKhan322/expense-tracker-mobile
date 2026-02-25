import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCategoryMeta } from "../../src/data/categories";
import { useTransactionsStore } from "../../src/store/transactionsStore";
import { formatMoney } from "../../src/utils/money";

export default function TransactionDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tx = useTransactionsStore((s) =>
    id ? s.getById(String(id)) : undefined,
  );
  const remove = useTransactionsStore((s) => s.remove);

  const meta = useMemo(
    () => getCategoryMeta(tx?.category ?? "Other"),
    [tx?.category],
  );

  if (!tx) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#000" }}
        edges={["top"]}
      >
        <Stack.Screen
          options={{ title: "Transaction", headerBackTitle: "Home" }}
        />
        <View style={{ padding: 18 }}>
          <Text style={{ color: "white", fontWeight: "900" }}>
            Transaction not found.
          </Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 14 }}>
            <Text style={{ color: "#9DFF3A", fontWeight: "900" }}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isExpense = tx.type === "expense";
  const amountColor = isExpense ? "#FF453A" : "#34C759";
  const sign = isExpense ? "-" : "+";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
      <Stack.Screen
        options={{
          title: "Transaction",
          headerBackTitle: "Home",
        }}
      />

      <View style={{ flex: 1, padding: 18 }}>
        <Text style={styles.h1}>Transaction</Text>

        <View style={styles.card}>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <View style={[styles.iconBox, { backgroundColor: meta.color }]}>
              <Ionicons name={meta.icon as any} size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "white", fontWeight: "900", fontSize: 18 }}>
                {tx.category}
              </Text>
              <Text style={{ color: "#a8a8a8", fontWeight: "700" }}>
                {tx.title}
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 16 }}>
            <Text style={styles.muted}>Amount</Text>
            <Text style={[styles.amount, { color: amountColor }]}>
              {sign}
              {formatMoney(tx.amount)}
            </Text>
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={styles.muted}>Type</Text>
            <Text style={{ color: "white", fontWeight: "900", marginTop: 6 }}>
              {tx.type.toUpperCase()}
            </Text>
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={styles.muted}>Date</Text>
            <Text style={{ color: "white", fontWeight: "900", marginTop: 6 }}>
              {new Date(tx.date).toLocaleString()}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() =>
            router.push({
              pathname: "/transaction/edit/[id]",
              params: { id: tx.id },
            })
          }
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryText}>Edit</Text>
        </Pressable>

        <Pressable
          onPress={async () => {
            await remove(tx.id);
            router.replace("/(tabs)");
          }}
          style={styles.dangerBtn}
        >
          <Text style={styles.dangerText}>Delete</Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={{ paddingVertical: 14 }}
        >
          <Text
            style={{ color: "#aaa", textAlign: "center", fontWeight: "800" }}
          >
            Back
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  h1: { color: "white", fontSize: 28, fontWeight: "900", marginBottom: 14 },

  card: {
    backgroundColor: "#0d0d0d",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  muted: { color: "#a8a8a8", fontWeight: "800" },
  amount: { fontSize: 34, fontWeight: "900", marginTop: 6 },

  primaryBtn: {
    backgroundColor: "#9DFF3A",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
  },
  primaryText: { color: "#111", fontWeight: "900", fontSize: 16 },

  dangerBtn: {
    backgroundColor: "#141414",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 12,
  },
  dangerText: { color: "#FF453A", fontWeight: "900", fontSize: 16 },
});
