import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCategoryMeta } from "../../src/data/categories";
import { useTransactionsStore } from "../../src/store/transactionsStore";
import { formatMoney } from "../../src/utils/money";

export default function TransactionDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const txId = String(id ?? "");

  const item = useTransactionsStore((s) => s.getById(txId));
  const remove = useTransactionsStore((s) => s.remove);

  // Force rerender on focus (store already updates, but this avoids edge cases)
  useFocusEffect(
    useCallback(() => {
      return () => {};
    }, []),
  );

  const handleDelete = () => {
    if (!txId) return;

    Alert.alert("Delete transaction?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await remove(txId);
          router.replace("/(tabs)");
        },
      },
    ]);
  };

  if (!item) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
        <View style={{ padding: 18 }}>
          <Text style={{ color: "white", fontWeight: "900", fontSize: 18 }}>
            Transaction not found.
          </Text>

          <Pressable
            onPress={() => router.back()}
            style={{ paddingVertical: 14 }}
          >
            <Text style={{ color: "#9DFF3A", fontWeight: "900" }}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const meta = getCategoryMeta(item.category);
  const isExpense = item.type === "expense";
  const date = new Date(item.date);

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
          Transaction
        </Text>

        <View
          style={{ backgroundColor: "#111", borderRadius: 20, padding: 16 }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 18,
                backgroundColor: meta.color,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Ionicons name={meta.icon as any} size={22} color="white" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ color: "white", fontWeight: "900", fontSize: 18 }}>
                {item.category}
              </Text>
              <Text style={{ color: "#aaa", marginTop: 2 }}>{item.title}</Text>
            </View>
          </View>

          <Text style={{ color: "#aaa" }}>Amount</Text>
          <Text
            style={{
              color: isExpense ? "#FF453A" : "#34C759",
              fontSize: 26,
              fontWeight: "900",
              marginBottom: 14,
              marginTop: 4,
            }}
          >
            {isExpense ? "-" : "+"}
            {formatMoney(item.amount)}
          </Text>

          <Text style={{ color: "#aaa" }}>Type</Text>
          <Text
            style={{
              color: "white",
              fontWeight: "900",
              marginBottom: 14,
              marginTop: 4,
            }}
          >
            {item.type.toUpperCase()}
          </Text>

          <Text style={{ color: "#aaa" }}>Date</Text>
          <Text style={{ color: "white", fontWeight: "900", marginTop: 4 }}>
            {date.toLocaleString()}
          </Text>
        </View>

        <Pressable
          onPress={() =>
            router.push({
              pathname: "/transaction/edit/[id]",
              params: { id: item.id },
            })
          }
          style={{
            backgroundColor: "#9DFF3A",
            padding: 14,
            borderRadius: 14,
            marginTop: 16,
          }}
        >
          <Text
            style={{ textAlign: "center", fontWeight: "900", color: "#111" }}
          >
            Edit
          </Text>
        </Pressable>

        <Pressable
          onPress={handleDelete}
          style={{
            backgroundColor: "#222",
            padding: 14,
            borderRadius: 14,
            marginTop: 10,
          }}
        >
          <Text
            style={{ textAlign: "center", fontWeight: "900", color: "#FF453A" }}
          >
            Delete
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={{ padding: 12, marginTop: 6 }}
        >
          <Text style={{ color: "#aaa", textAlign: "center" }}>Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
