// app/add.tsx
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CategoryGrid from "../src/components/categoryGrid";
import { getCategoriesForType } from "../src/data/categories";
import { useTransactionsStore } from "../src/store/transactionsStore";
import { TransactionType } from "../src/types/transaction";
import { formatDateInput, todayISODate } from "../src/utils/date";

export default function Add() {
  const add = useTransactionsStore((s) => s.add);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");

  const [dateISO, setDateISO] = useState<string>(todayISODate());
  const [showPicker, setShowPicker] = useState(false);

  const categories = useMemo(() => getCategoriesForType(type), [type]);
  const [category, setCategory] = useState(categories[0]?.key ?? "Other");

  React.useEffect(() => {
    const next = getCategoriesForType(type);
    if (!next.some((c) => c.key === category)) {
      setCategory(next[0]?.key ?? "Other");
    }
  }, [type]); // keep as you had (fine)

  const onSave = async () => {
    const parsed = Number(amount);

    if (!title.trim()) return Alert.alert("Missing title", "Enter a title.");
    if (!Number.isFinite(parsed) || parsed <= 0)
      return Alert.alert(
        "Invalid amount",
        "Enter a valid number greater than 0.",
      );

    await add({
      title: title.trim(),
      amount: parsed,
      type,
      category,
      date: dateISO,
    });

    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 18, paddingBottom: 140 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.h1}>Add Transaction</Text>

        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          <Pressable
            onPress={() => setType("expense")}
            style={[styles.typeBtn, type === "expense" && styles.typeBtnActive]}
          >
            <Text
              style={[
                styles.typeText,
                type === "expense" && styles.typeTextActive,
              ]}
            >
              Expense
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setType("income")}
            style={[styles.typeBtn, type === "income" && styles.typeBtnActive]}
          >
            <Text
              style={[
                styles.typeText,
                type === "income" && styles.typeTextActive,
              ]}
            >
              Income
            </Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Grocery"
          placeholderTextColor="#666"
          style={styles.input}
        />

        <Text style={[styles.label, { marginTop: 14 }]}>Amount</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="e.g. 25.50"
          placeholderTextColor="#666"
          keyboardType="decimal-pad"
          style={styles.input}
        />

        <Text style={[styles.label, { marginTop: 14 }]}>Date</Text>
        <Pressable onPress={() => setShowPicker(true)} style={styles.dateRow}>
          <Text style={{ color: "white", fontWeight: "800" }}>
            {formatDateInput(dateISO)}
          </Text>
          <Text style={{ color: "#9DFF3A", fontWeight: "900" }}>Change</Text>
        </Pressable>

        {showPicker && (
          <DateTimePicker
            value={new Date(dateISO)}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(_, selected) => {
              if (Platform.OS !== "ios") setShowPicker(false);
              if (selected) setDateISO(selected.toISOString());
            }}
          />
        )}

        {Platform.OS === "ios" && showPicker && (
          <Pressable
            onPress={() => setShowPicker(false)}
            style={styles.doneBtn}
          >
            <Text style={{ color: "#111", fontWeight: "900" }}>Done</Text>
          </Pressable>
        )}

        <Text style={[styles.label, { marginTop: 14 }]}>Category</Text>
        <CategoryGrid
          categories={categories}
          selected={category}
          onSelect={setCategory}
        />

        <Pressable onPress={onSave} style={styles.saveBtn}>
          <Text style={{ color: "#111", fontWeight: "900", fontSize: 16 }}>
            Save
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={{ paddingVertical: 14 }}
        >
          <Text
            style={{ color: "#aaa", textAlign: "center", fontWeight: "800" }}
          >
            Cancel
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  h1: { color: "white", fontSize: 20, fontWeight: "900", marginBottom: 10 },
  label: { color: "#aaa", fontWeight: "800", marginBottom: 8 },
  input: {
    backgroundColor: "#0d0d0d",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "white",
  },
  typeBtn: {
    flex: 1,
    backgroundColor: "#141414",
    paddingVertical: 12,
    borderRadius: 16,
  },
  typeBtnActive: {
    backgroundColor: "#1f1f1f",
    borderColor: "#333",
    borderWidth: 1,
  },
  typeText: { textAlign: "center", color: "#cfcfcf", fontWeight: "900" },
  typeTextActive: { color: "white" },
  dateRow: {
    backgroundColor: "#0d0d0d",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  doneBtn: {
    marginTop: 10,
    backgroundColor: "#9DFF3A",
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
  },
  saveBtn: {
    backgroundColor: "#9DFF3A",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 18,
  },
});
