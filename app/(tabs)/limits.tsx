// app/(tabs)/limits.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  EXPENSE_CATEGORY_KEYS,
  getCategoryMeta,
} from "../../src/data/categories";
import { useSettingsStore } from "../../src/store/settingsStore";
import { useTransactionsStore } from "../../src/store/transactionsStore";
import { formatMoney } from "../../src/utils/money";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function toNumberOrNull(raw: string) {
  const cleaned = raw.trim().replace(/,/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return n;
}

type Flow = "add" | "edit";
type Step = "picker" | "editor";

export default function Limits() {
  const currency = useSettingsStore((s) => s.currency);
  const limits = useSettingsStore((s) => s.limits);
  const setLimit = useSettingsStore((s) => s.setLimit);
  const removeLimit = useSettingsStore((s) => s.removeLimit);

  const limitsRefreshDay = useSettingsStore((s) => s.limitsRefreshDay);
  const setLimitsRefreshDay = useSettingsStore((s) => s.setLimitsRefreshDay);

  const transactions = useTransactionsStore((s) => s.transactions);

  const monthStart = useMemo(() => startOfMonth(new Date()).getTime(), []);

  const monthExpensesByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.type !== "expense") continue;
      const t = new Date(tx.date).getTime();
      if (t < monthStart) continue;
      map.set(tx.category, (map.get(tx.category) ?? 0) + tx.amount);
    }
    return map;
  }, [transactions, monthStart]);

  const monthTotalSpent = useMemo(() => {
    let s = 0;
    for (const v of monthExpensesByCategory.values()) s += v;
    return s;
  }, [monthExpensesByCategory]);

  const limitedCategories = useMemo(() => {
    const keys = Object.keys(limits ?? {});
    const allowed = new Set(EXPENSE_CATEGORY_KEYS as unknown as string[]);
    return keys
      .filter((k) => allowed.has(k))
      .filter((k) => {
        const v = (limits as any)?.[k];
        return typeof v === "number" && Number.isFinite(v) && v > 0;
      })
      .sort((a, b) => a.localeCompare(b));
  }, [limits]);

  // Refresh-day picker modal
  const [refreshPickerOpen, setRefreshPickerOpen] = useState(false);

  // Modal + flow/step state
  const [open, setOpen] = useState(false);
  const [flow, setFlow] = useState<Flow>("add");
  const [step, setStep] = useState<Step>("picker");
  const [selected, setSelected] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  // Smooth/snappy animation
  const backdrop = useRef(new Animated.Value(0)).current;
  const sheet = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!open) return;

    backdrop.setValue(0);
    sheet.setValue(1);

    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 1,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(sheet, {
        toValue: 0,
        speed: 22,
        bounciness: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, [open, backdrop, sheet]);

  function closeModal() {
    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 0,
        duration: 120,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(sheet, {
        toValue: 1,
        duration: 140,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) return;
      setOpen(false);
      setSelected(null);
      setAmount("");
      setFlow("add");
      setStep("picker");
    });
  }

  function openAdd() {
    setFlow("add");
    setStep("picker");
    setSelected(null);
    setAmount("");
    setOpen(true);
  }

  function openEdit(category: string) {
    const current = (limits as any)?.[category];
    setFlow("edit");
    setStep("editor");
    setSelected(category);
    setAmount(
      typeof current === "number" && Number.isFinite(current)
        ? String(current)
        : "",
    );
    setOpen(true);
  }

  async function saveFromModal() {
    if (!selected) return;
    const n = toNumberOrNull(amount);
    if (n == null || n <= 0) {
      await removeLimit(selected);
      closeModal();
      return;
    }
    await setLimit(selected, n);
    closeModal();
  }

  function onBackFromEditor() {
    if (flow === "edit") {
      closeModal();
      return;
    }
    setStep("picker");
    setSelected(null);
    setAmount("");
  }

  const sheetTranslateY = sheet.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 32],
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text
            style={{ color: "white", fontSize: 24, fontWeight: "900", flex: 1 }}
          >
            Limits
          </Text>

          <Pressable
            onPress={openAdd}
            style={({ pressed }) => ({
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 14,
              backgroundColor: "#9DFF3A",
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Text style={{ color: "#111", fontWeight: "900" }}>Add</Text>
          </Pressable>
        </View>

        {/* Refresh day selector */}
        <Pressable
          onPress={() => setRefreshPickerOpen(true)}
          style={({ pressed }) => ({
            backgroundColor: "#0d0d0d",
            borderRadius: 20,
            borderWidth: 1,
            borderColor: "#151515",
            padding: 14,
            marginTop: 12,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ color: "white", fontWeight: "900", flex: 1 }}>
              Limits refresh day
            </Text>
            <Text style={{ color: "#9DFF3A", fontWeight: "900" }}>
              Day {limitsRefreshDay}
            </Text>
          </View>

          <Text style={{ color: "#6f6f6f", fontWeight: "800", marginTop: 6 }}>
            We’ll use this date to prompt you each month to review/reuse limits.
          </Text>
        </Pressable>

        {/* Month spending */}
        <View
          style={{
            backgroundColor: "#0d0d0d",
            borderRadius: 20,
            borderWidth: 1,
            borderColor: "#151515",
            padding: 14,
            marginTop: 12,
            marginBottom: 14,
          }}
        >
          <Text style={{ color: "#9a9a9a", fontWeight: "900" }}>
            This month spending (expenses)
          </Text>
          <Text
            style={{
              color: "white",
              fontWeight: "900",
              fontSize: 20,
              marginTop: 8,
            }}
          >
            {formatMoney(monthTotalSpent, currency)}
          </Text>

          <Text style={{ color: "#6f6f6f", fontWeight: "800", marginTop: 6 }}>
            Add limits for the categories you want to control.
          </Text>
        </View>

        {limitedCategories.length === 0 ? (
          <View style={{ paddingVertical: 22 }}>
            <Text style={{ color: "#aaa", fontWeight: "900", fontSize: 16 }}>
              No limits yet
            </Text>
            <Text style={{ color: "#666", fontWeight: "800", marginTop: 6 }}>
              Tap “Add” to choose a category and set a monthly limit.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {limitedCategories.map((category) => {
              const meta = getCategoryMeta(category);
              const spent = monthExpensesByCategory.get(category) ?? 0;
              const limit = (limits as any)?.[category] as number;

              const over = spent > limit;
              const pct = limit > 0 ? Math.min(1, spent / limit) : 0;
              const pct100 = limit > 0 ? Math.round((spent / limit) * 100) : 0;

              return (
                <View
                  key={category}
                  style={{
                    backgroundColor: "#0d0d0d",
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: "#151515",
                    padding: 12,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 18,
                        backgroundColor: meta.color,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons
                        name={meta.icon as any}
                        size={20}
                        color="#fff"
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: "white",
                          fontWeight: "900",
                          fontSize: 16,
                        }}
                      >
                        {meta.label}
                      </Text>
                      <Text
                        style={{
                          color: over ? "#FF453A" : "#bdbdbd",
                          fontWeight: "900",
                          marginTop: 6,
                        }}
                      >
                        {formatMoney(spent, currency)} /{" "}
                        {formatMoney(limit, currency)}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      marginTop: 10,
                      height: 8,
                      borderRadius: 999,
                      backgroundColor: "#1b1b1b",
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        width: `${Math.round(pct * 100)}%`,
                        height: "100%",
                        backgroundColor: over ? "#FF453A" : "#9DFF3A",
                      }}
                    />
                  </View>

                  <Text
                    style={{
                      color: over ? "#FF453A" : "#8b8b8b",
                      fontWeight: "800",
                      marginTop: 8,
                    }}
                  >
                    {pct100}% used
                  </Text>

                  <View
                    style={{ flexDirection: "row", gap: 10, marginTop: 12 }}
                  >
                    <Pressable
                      onPress={() => openEdit(category)}
                      style={({ pressed }) => ({
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 14,
                        backgroundColor: "#141414",
                        borderWidth: 1,
                        borderColor: "#222",
                        alignItems: "center",
                        opacity: pressed ? 0.75 : 1,
                      })}
                    >
                      <Text style={{ color: "#bbb", fontWeight: "900" }}>
                        Edit
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={async () => {
                        await removeLimit(category);
                      }}
                      style={({ pressed }) => ({
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 14,
                        backgroundColor: "#141414",
                        borderWidth: 1,
                        borderColor: "#222",
                        alignItems: "center",
                        opacity: pressed ? 0.75 : 1,
                      })}
                    >
                      <Text style={{ color: "#FF453A", fontWeight: "900" }}>
                        Clear
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Refresh-day picker modal */}
      <Modal
        visible={refreshPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setRefreshPickerOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }}>
          <Pressable
            style={{ flex: 1 }}
            onPress={() => setRefreshPickerOpen(false)}
          />
          <View
            style={{
              backgroundColor: "#0b0b0b",
              padding: 16,
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              borderWidth: 1,
              borderColor: "#151515",
              maxHeight: "65%",
            }}
          >
            <View
              style={{
                alignSelf: "center",
                width: 48,
                height: 5,
                borderRadius: 999,
                backgroundColor: "#2a2a2a",
                marginBottom: 12,
              }}
            />

            <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>
              Choose refresh day
            </Text>
            <Text style={{ color: "#777", fontWeight: "800", marginTop: 6 }}>
              Pick 1–28 (safe for all months).
            </Text>

            <ScrollView
              style={{ marginTop: 12 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={{ gap: 10 }}>
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => {
                  const active = d === limitsRefreshDay;
                  return (
                    <Pressable
                      key={d}
                      onPress={async () => {
                        await setLimitsRefreshDay(d);
                        setRefreshPickerOpen(false);
                      }}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 12,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: active ? "#9DFF3A" : "#151515",
                        backgroundColor: "#0d0d0d",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{ color: "white", fontWeight: "900", flex: 1 }}
                      >
                        Day {d}
                      </Text>
                      {active && (
                        <Ionicons name="checkmark" size={18} color="#9DFF3A" />
                      )}
                    </Pressable>
                  );
                })}
              </View>
              <View style={{ height: 12 }} />
            </ScrollView>

            <Pressable
              onPress={() => setRefreshPickerOpen(false)}
              style={{
                marginTop: 10,
                paddingVertical: 14,
                borderRadius: 16,
                backgroundColor: "#141414",
                borderWidth: 1,
                borderColor: "#222",
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  fontWeight: "900",
                  color: "#bbb",
                }}
              >
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Add/Edit modal */}
      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            opacity: backdrop,
            padding: 18,
            justifyContent: "center",
          }}
        >
          <Pressable
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            onPress={closeModal}
          />

          <Animated.View
            style={{ transform: [{ translateY: sheetTranslateY }] }}
          >
            <View
              style={{
                backgroundColor: "#0d0d0d",
                borderRadius: 20,
                borderWidth: 1,
                borderColor: "#151515",
                padding: 14,
                maxHeight: "80%",
              }}
            >
              <Text style={{ color: "white", fontWeight: "900", fontSize: 18 }}>
                {step === "picker" ? "Choose Category" : "Set Limit"}
              </Text>

              {step === "picker" ? (
                <>
                  <Text
                    style={{
                      color: "#6f6f6f",
                      fontWeight: "800",
                      marginTop: 8,
                    }}
                  >
                    Tap a category to set a monthly limit.
                  </Text>

                  <ScrollView style={{ marginTop: 12 }}>
                    <View style={{ gap: 10 }}>
                      {EXPENSE_CATEGORY_KEYS.map((k) => {
                        const meta = getCategoryMeta(k);
                        const already =
                          typeof (limits as any)?.[k] === "number";

                        return (
                          <Pressable
                            key={k}
                            onPress={() => {
                              setSelected(k);
                              setStep("editor");
                              const cur = (limits as any)?.[k];
                              setAmount(
                                typeof cur === "number" && Number.isFinite(cur)
                                  ? String(cur)
                                  : "",
                              );
                            }}
                            style={({ pressed }) => ({
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 12,
                              padding: 12,
                              borderRadius: 16,
                              borderWidth: 1,
                              borderColor: "#151515",
                              backgroundColor: "#111",
                              opacity: pressed ? 0.75 : 1,
                            })}
                          >
                            <View
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 16,
                                backgroundColor: meta.color,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Ionicons
                                name={meta.icon as any}
                                size={18}
                                color="#fff"
                              />
                            </View>

                            <View style={{ flex: 1 }}>
                              <Text
                                style={{ color: "white", fontWeight: "900" }}
                              >
                                {meta.label}
                              </Text>
                              <Text
                                style={{
                                  color: "#6f6f6f",
                                  fontWeight: "800",
                                  marginTop: 4,
                                }}
                              >
                                {already
                                  ? "Limit already set (tap to edit)"
                                  : "No limit yet"}
                              </Text>
                            </View>

                            <Ionicons
                              name="chevron-forward"
                              size={18}
                              color="#666"
                            />
                          </Pressable>
                        );
                      })}
                    </View>
                  </ScrollView>

                  <View
                    style={{ flexDirection: "row", gap: 10, marginTop: 14 }}
                  >
                    <Pressable
                      onPress={closeModal}
                      style={({ pressed }) => ({
                        flex: 1,
                        paddingVertical: 12,
                        borderRadius: 14,
                        backgroundColor: "#141414",
                        borderWidth: 1,
                        borderColor: "#222",
                        alignItems: "center",
                        opacity: pressed ? 0.75 : 1,
                      })}
                    >
                      <Text style={{ color: "#bbb", fontWeight: "900" }}>
                        Cancel
                      </Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <>
                  {(() => {
                    const meta = getCategoryMeta(selected);
                    return (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 12,
                          marginTop: 12,
                        }}
                      >
                        <View
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: 18,
                            backgroundColor: meta.color,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Ionicons
                            name={meta.icon as any}
                            size={20}
                            color="#fff"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              color: "white",
                              fontWeight: "900",
                              fontSize: 16,
                            }}
                          >
                            {meta.label}
                          </Text>
                          <Text
                            style={{
                              color: "#6f6f6f",
                              fontWeight: "800",
                              marginTop: 6,
                            }}
                          >
                            Enter a monthly limit (numbers only).
                          </Text>
                        </View>
                      </View>
                    );
                  })()}

                  <View style={{ marginTop: 12 }}>
                    <Text
                      style={{
                        color: "#8b8b8b",
                        fontWeight: "800",
                        marginBottom: 6,
                      }}
                    >
                      Monthly limit
                    </Text>
                    <TextInput
                      value={amount}
                      onChangeText={setAmount}
                      keyboardType="numeric"
                      placeholder="e.g. 200"
                      placeholderTextColor="#555"
                      style={{
                        backgroundColor: "#111",
                        borderWidth: 1,
                        borderColor: "#1a1a1a",
                        borderRadius: 14,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        color: "white",
                        fontWeight: "800",
                      }}
                      returnKeyType="done"
                      onSubmitEditing={saveFromModal}
                    />
                  </View>

                  <View
                    style={{ flexDirection: "row", gap: 10, marginTop: 14 }}
                  >
                    <Pressable
                      onPress={onBackFromEditor}
                      style={({ pressed }) => ({
                        flex: 1,
                        paddingVertical: 12,
                        borderRadius: 14,
                        backgroundColor: "#141414",
                        borderWidth: 1,
                        borderColor: "#222",
                        alignItems: "center",
                        opacity: pressed ? 0.75 : 1,
                      })}
                    >
                      <Text style={{ color: "#bbb", fontWeight: "900" }}>
                        Back
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={saveFromModal}
                      style={({ pressed }) => ({
                        flex: 1,
                        paddingVertical: 12,
                        borderRadius: 14,
                        backgroundColor: "#9DFF3A",
                        alignItems: "center",
                        opacity: pressed ? 0.75 : 1,
                      })}
                    >
                      <Text style={{ color: "#111", fontWeight: "900" }}>
                        Save
                      </Text>
                    </Pressable>
                  </View>

                  <Pressable
                    onPress={async () => {
                      if (!selected) return;
                      await removeLimit(selected);
                      closeModal();
                    }}
                    style={({ pressed }) => ({
                      marginTop: 10,
                      paddingVertical: 12,
                      borderRadius: 14,
                      backgroundColor: "#141414",
                      borderWidth: 1,
                      borderColor: "#222",
                      alignItems: "center",
                      opacity: pressed ? 0.75 : 1,
                    })}
                  >
                    <Text style={{ color: "#FF453A", fontWeight: "900" }}>
                      Clear this limit
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}
