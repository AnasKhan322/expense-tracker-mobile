import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";

import {
  getTransactions,
  saveTransactions,
} from "../src/storage/transactionStorage";
import { Transaction, TransactionType } from "../src/types/transaction";

export default function Add() {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [type, setType] = useState<TransactionType>("expense");

  const save = async () => {
    const parsed = Number(amount);

    if (!title.trim()) return Alert.alert("Missing title", "Enter a title.");
    if (!Number.isFinite(parsed) || parsed <= 0)
      return Alert.alert("Invalid amount", "Enter an amount > 0.");

    const newItem: Transaction = {
      id: Date.now().toString(),
      title: title.trim(),
      amount: parsed,
      category: category.trim() || "Other",
      type,
      date: new Date().toISOString(),
    };

    const existing = await getTransactions();
    await saveTransactions([newItem, ...existing]);
    router.dismiss();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000", padding: 18, gap: 12 }}>
      <Text style={{ color: "white", fontSize: 20, fontWeight: "800" }}>
        Add Transaction
      </Text>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Pressable
          onPress={() => setType("expense")}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 12,
            backgroundColor: type === "expense" ? "#FF453A" : "#222",
          }}
        >
          <Text
            style={{ color: "white", textAlign: "center", fontWeight: "800" }}
          >
            Expense
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setType("income")}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 12,
            backgroundColor: type === "income" ? "#34C759" : "#222",
          }}
        >
          <Text
            style={{ color: "white", textAlign: "center", fontWeight: "800" }}
          >
            Income
          </Text>
        </Pressable>
      </View>

      <Text style={{ color: "#aaa" }}>Title</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        style={{
          backgroundColor: "#111",
          color: "white",
          padding: 12,
          borderRadius: 12,
        }}
        placeholder="e.g. Grocery"
        placeholderTextColor="#666"
      />

      <Text style={{ color: "#aaa" }}>Amount</Text>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        style={{
          backgroundColor: "#111",
          color: "white",
          padding: 12,
          borderRadius: 12,
        }}
        placeholder="e.g. 25.50"
        placeholderTextColor="#666"
      />

      <Text style={{ color: "#aaa" }}>Category</Text>
      <TextInput
        value={category}
        onChangeText={setCategory}
        style={{
          backgroundColor: "#111",
          color: "white",
          padding: 12,
          borderRadius: 12,
        }}
        placeholder="e.g. Food"
        placeholderTextColor="#666"
      />

      <Pressable
        onPress={save}
        style={{
          backgroundColor: "#9DFF3A",
          padding: 14,
          borderRadius: 12,
          marginTop: 8,
        }}
      >
        <Text style={{ textAlign: "center", fontWeight: "900", color: "#111" }}>
          Save
        </Text>
      </Pressable>

      <Pressable onPress={() => router.dismiss()} style={{ padding: 12 }}>
        <Text style={{ color: "#aaa", textAlign: "center" }}>Cancel</Text>
      </Pressable>
    </View>
  );
}
