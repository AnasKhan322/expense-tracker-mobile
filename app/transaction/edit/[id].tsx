import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CategoryGrid from "../../../src/components/categoryGrid";
import { getCategoriesForType } from "../../../src/data/categories";
import { useTransactionsStore } from "../../../src/store/transactionsStore";
import { Transaction, TransactionType } from "../../../src/types/transaction";

export default function EditTransaction() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const txId = String(id ?? "");

  const item = useTransactionsStore((s) => s.getById(txId));
  const update = useTransactionsStore((s) => s.update);
  const remove = useTransactionsStore((s) => s.remove);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState("Other");
  const [date, setDate] = useState<string>(new Date().toISOString());

  useEffect(() => {
    if (!item) return;
    setTitle(item.title);
    setAmount(String(item.amount));
    setType(item.type);
    setCategory(item.category);
    setDate(item.date);
  }, [item]);

  const allowedCategories = useMemo(() => getCategoriesForType(type), [type]);

  const switchType = (nextType: TransactionType) => {
    setType(nextType);
    const allowed = getCategoriesForType(nextType).map((c) => c.key);
    if (!allowed.includes(category)) setCategory(allowed[0]);
  };

  const save = async () => {
    if (!item) return;

    const parsed = Number(amount);
    if (!title.trim()) return Alert.alert("Missing title", "Enter a title.");
    if (!Number.isFinite(parsed) || parsed <= 0)
      return Alert.alert("Invalid amount", "Enter an amount > 0.");

    const updated: Transaction = {
      ...item,
      title: title.trim(),
      amount: parsed,
      type,
      category,
      date,
    };

    await update(updated);
    router.back(); // ✅ return to wherever user came from
  };

  const del = async () => {
    if (!txId) return;

    Alert.alert("Delete transaction?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await remove(txId);
          router.back(); // if came from details -> details will handle missing; home also ok
        },
      },
    ]);
  };

  if (!item) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
        <ScrollView contentContainerStyle={{ padding: 18 }}>
          <Text style={{ color: "white", fontWeight: "900", fontSize: 18 }}>
            Transaction not found.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{ paddingVertical: 14 }}
          >
            <Text style={{ color: "#9DFF3A", fontWeight: "900" }}>Go back</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <Text
          style={{
            color: "white",
            fontSize: 20,
            fontWeight: "900",
            marginBottom: 12,
          }}
        >
          Edit Transaction
        </Text>

        <Text style={{ color: "#aaa", marginBottom: 8 }}>Type</Text>

        <Pressable
          onPress={() => switchType("expense")}
          style={{
            padding: 12,
            borderRadius: 12,
            backgroundColor: type === "expense" ? "#FF453A" : "#222",
            marginBottom: 10,
          }}
        >
          <Text
            style={{ color: "white", textAlign: "center", fontWeight: "900" }}
          >
            Expense
          </Text>
        </Pressable>

        <Pressable
          onPress={() => switchType("income")}
          style={{
            padding: 12,
            borderRadius: 12,
            backgroundColor: type === "income" ? "#34C759" : "#222",
            marginBottom: 14,
          }}
        >
          <Text
            style={{ color: "white", textAlign: "center", fontWeight: "900" }}
          >
            Income
          </Text>
        </Pressable>

        <Text style={{ color: "#aaa", marginBottom: 6 }}>Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          style={{
            backgroundColor: "#111",
            color: "white",
            padding: 12,
            borderRadius: 12,
            marginBottom: 12,
          }}
          placeholder="e.g. Grocery"
          placeholderTextColor="#666"
        />

        <Text style={{ color: "#aaa", marginBottom: 6 }}>Amount</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          style={{
            backgroundColor: "#111",
            color: "white",
            padding: 12,
            borderRadius: 12,
            marginBottom: 14,
          }}
          placeholder="e.g. 25.50"
          placeholderTextColor="#666"
        />

        <Text style={{ color: "#aaa", marginBottom: 10 }}>Category</Text>
        <CategoryGrid selected={category} onSelect={setCategory} type={type} />

        <Pressable
          onPress={save}
          style={{
            backgroundColor: "#9DFF3A",
            padding: 14,
            borderRadius: 12,
            marginTop: 18,
          }}
        >
          <Text
            style={{ textAlign: "center", fontWeight: "900", color: "#111" }}
          >
            Save Changes
          </Text>
        </Pressable>

        <Pressable
          onPress={del}
          style={{
            backgroundColor: "#222",
            padding: 14,
            borderRadius: 12,
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
          <Text style={{ color: "#aaa", textAlign: "center" }}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
