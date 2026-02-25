import DateTimePicker from "@react-native-community/datetimepicker";
import { Stack, router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CategoryGrid from "../../../src/components/categoryGrid";
import { getCategoriesForType } from "../../../src/data/categories";
import { useTransactionsStore } from "../../../src/store/transactionsStore";
import type { TransactionType } from "../../../src/types/transaction";
import { formatDateInput } from "../../../src/utils/date";

export default function EditTransaction() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const tx = useTransactionsStore((s) =>
    id ? s.getById(String(id)) : undefined,
  );
  const update = useTransactionsStore((s) => s.update);
  const remove = useTransactionsStore((s) => s.remove);

  // ✅ Hooks must ALWAYS run, so we initialize with safe defaults
  const [type, setType] = useState<TransactionType>("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dateISO, setDateISO] = useState<string>(new Date().toISOString());
  const [showPicker, setShowPicker] = useState(false);

  const categories = useMemo(() => getCategoriesForType(type), [type]);
  const [category, setCategory] = useState<string>("Other");

  // ✅ When tx arrives, populate state once
  useEffect(() => {
    if (!tx) return;
    setType(tx.type);
    setTitle(tx.title);
    setAmount(String(tx.amount));
    setDateISO(tx.date);
    setCategory(tx.category || "Other");
  }, [tx?.id]);

  // Ensure category stays valid for the selected type
  useEffect(() => {
    const next = getCategoriesForType(type);
    if (!next.some((c) => c.key === category)) {
      setCategory(next[0]?.key ?? "Other");
    }
  }, [type, category]);

  const onSave = async () => {
    if (!tx) return;

    const parsed = Number(amount);
    if (!title.trim()) return Alert.alert("Missing title", "Enter a title.");
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return Alert.alert("Invalid amount", "Enter a valid number > 0.");
    }

    await update({
      ...tx,
      title: title.trim(),
      amount: parsed,
      type,
      category,
      date: dateISO,
      updatedAt: new Date().toISOString(),
    });

    router.replace("/(tabs)");
  };

  const onDelete = async () => {
    if (!tx) return;
    await remove(tx.id);
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
      <Stack.Screen
        options={{
          title: "Edit Transaction",
          headerBackTitle: "Details", // ✅ nicer than "(tabs)"
        }}
      />

      {!tx ? (
        <View style={{ padding: 18 }}>
          <Text style={{ color: "white", fontWeight: "900" }}>
            Transaction not found.
          </Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 14 }}>
            <Text style={{ color: "#9DFF3A", fontWeight: "900" }}>Go back</Text>
          </Pressable>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          >
            <Text style={styles.h1}>Edit Transaction</Text>

            <Text style={styles.label}>Type</Text>
            <View style={{ gap: 10 }}>
              <Pressable
                onPress={() => setType("expense")}
                style={[
                  styles.typeBtn,
                  type === "expense" && styles.typeBtnExpenseActive,
                ]}
              >
                <Text style={styles.typeText}>Expense</Text>
              </Pressable>

              <Pressable
                onPress={() => setType("income")}
                style={[
                  styles.typeBtn,
                  type === "income" && styles.typeBtnIncomeActive,
                ]}
              >
                <Text style={styles.typeText}>Income</Text>
              </Pressable>
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>Title</Text>
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
            <Pressable
              onPress={() => setShowPicker(true)}
              style={styles.dateRow}
            >
              <Text style={{ color: "white", fontWeight: "900" }}>
                {formatDateInput(dateISO)}
              </Text>
              <Text style={{ color: "#9DFF3A", fontWeight: "900" }}>
                Change
              </Text>
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
              onSelect={(k) => setCategory(k)}
            />

            <Pressable onPress={onSave} style={styles.saveBtn}>
              <Text style={{ color: "#111", fontWeight: "900", fontSize: 16 }}>
                Save Changes
              </Text>
            </Pressable>

            <Pressable onPress={onDelete} style={styles.deleteBtn}>
              <Text
                style={{ color: "#FF453A", fontWeight: "900", fontSize: 16 }}
              >
                Delete
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              style={{ paddingVertical: 14 }}
            >
              <Text
                style={{
                  color: "#aaa",
                  textAlign: "center",
                  fontWeight: "800",
                }}
              >
                Cancel
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  h1: { color: "white", fontSize: 28, fontWeight: "900", marginBottom: 14 },
  label: { color: "#aaa", fontWeight: "900", marginBottom: 8 },
  input: {
    backgroundColor: "#0d0d0d",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "white",
  },
  typeBtn: {
    backgroundColor: "#141414",
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  typeBtnExpenseActive: { backgroundColor: "#FF453A" },
  typeBtnIncomeActive: { backgroundColor: "#34C759" },
  typeText: { color: "white", fontWeight: "900", fontSize: 16 },
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
  deleteBtn: {
    backgroundColor: "#141414",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 12,
  },
});
