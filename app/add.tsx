import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CategoryGrid from "../src/components/categoryGrid";
import { getCategoriesForType } from "../src/data/categories";
import { useTransactionsStore } from "../src/store/transactionsStore";
import { Transaction, TransactionType } from "../src/types/transaction";

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function AddTransaction() {
  const add = useTransactionsStore((s) => s.add);

  const [type, setType] = useState<TransactionType>("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("Food");

  const allowed = useMemo(() => getCategoriesForType(type), [type]);

  const switchType = (nextType: TransactionType) => {
    setType(nextType);
    const keys = getCategoriesForType(nextType).map((c) => c.key);
    if (!keys.includes(category)) setCategory(keys[0]);
  };

  const save = async () => {
    const parsed = Number(amount);
    if (!title.trim()) return Alert.alert("Missing title", "Enter a title.");
    if (!Number.isFinite(parsed) || parsed <= 0)
      return Alert.alert("Invalid amount", "Enter an amount > 0.");

    const tx: Transaction = {
      id: makeId(),
      title: title.trim(),
      amount: parsed,
      category,
      type,
      date: new Date().toISOString(),
    };

    await add(tx);
    router.back();
  };

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
          Add Transaction
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
            Save
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
