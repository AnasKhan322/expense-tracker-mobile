// src/components/transactionItem.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";

import { getCategoryMeta } from "../data/categories";
import { useSettingsStore } from "../store/settingsStore";
import type { Transaction } from "../types/transaction";
import { formatShortDate } from "../utils/date";
import { formatMoney } from "../utils/money";

type Props = {
  item: Transaction;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void | Promise<void>;
  onSwipeOpen?: (ref: any) => void;
};

export default function TransactionItem({
  item,
  onPress,
  onEdit,
  onDelete,
  onSwipeOpen,
}: Props) {
  const meta = useMemo(() => getCategoryMeta(item.category), [item.category]);
  const currency = useSettingsStore((s) => s.currency);

  const swipeRef = useRef<any>(null);

  // Prevent "tap" firing after a swipe
  const touch = useRef({ x: 0, y: 0, moved: false });

  const sign = item.type === "income" ? "+" : "-";
  const color = item.type === "income" ? "#34C759" : "#FF453A";

  const renderRightActions = () => {
    return (
      <View style={styles.actionsWrap}>
        <Pressable
          onPress={() => {
            swipeRef.current?.close?.();
            onEdit();
          }}
          style={[styles.actionBtn, styles.editBtn]}
        >
          <Ionicons name="pencil" size={18} color="#111" />
          <Text style={styles.actionTextDark}>Edit</Text>
        </Pressable>

        <Pressable
          onPress={async () => {
            swipeRef.current?.close?.();
            await onDelete();
          }}
          style={[styles.actionBtn, styles.deleteBtn]}
        >
          <Ionicons name="trash" size={18} color="#fff" />
          <Text style={styles.actionTextLight}>Delete</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      friction={1.2}
      rightThreshold={60}
      overshootRight={true}
      enableTrackpadTwoFingerGesture
      renderRightActions={renderRightActions}
      onSwipeableWillOpen={() => onSwipeOpen?.(swipeRef.current)}
    >
      <Pressable
        style={styles.card}
        onPress={() => {
          if (!touch.current.moved) onPress();
        }}
        onPressIn={(e) => {
          touch.current.x = e.nativeEvent.pageX;
          touch.current.y = e.nativeEvent.pageY;
          touch.current.moved = false;
        }}
        onPressOut={(e) => {
          const dx = Math.abs(e.nativeEvent.pageX - touch.current.x);
          const dy = Math.abs(e.nativeEvent.pageY - touch.current.y);
          if (dx > 10 && dx > dy) touch.current.moved = true;
        }}
      >
        <View style={[styles.iconWrap, { backgroundColor: meta.color }]}>
          <Ionicons name={meta.icon as any} size={18} color="#fff" />
        </View>

        {/* ✅ flipped: title primary, category secondary */}
        <View style={{ flex: 1 }}>
          <Text style={styles.titleMain} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.categorySub} numberOfLines={1}>
            {meta.label}
          </Text>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text style={[styles.amount, { color }]}>
            {sign} {formatMoney(item.amount, currency)}
          </Text>
          <Text style={styles.date}>{formatShortDate(item.date)}</Text>
        </View>
      </Pressable>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0d0d0d",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#151515",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  titleMain: { color: "white", fontWeight: "900", fontSize: 16 },
  categorySub: { color: "#9a9a9a", marginTop: 4, fontWeight: "700" },

  amount: { fontWeight: "900", fontSize: 16 },
  date: { color: "#8b8b8b", marginTop: 6, fontWeight: "700" },

  actionsWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingRight: 8,
    marginBottom: 12,
  },
  actionBtn: {
    height: "100%",
    minWidth: 88,
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  editBtn: { backgroundColor: "#9DFF3A" },
  deleteBtn: { backgroundColor: "#FF453A" },
  actionTextDark: { color: "#111", fontWeight: "900" },
  actionTextLight: { color: "#fff", fontWeight: "900" },
});
