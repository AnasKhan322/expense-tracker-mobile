import { Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

import { getCategoryMeta } from "../data/categories";
import { Transaction } from "../types/transaction";
import { formatMoney } from "../utils/money";

type Props = {
  item: Transaction;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void | Promise<void>;
  onSwipeOpen?: (ref: any) => void;
};

const ROW_HEIGHT = 74;
const EDIT_W = 92;
const DELETE_W = 104;

const MOVE_X_THRESHOLD = 10; // tune 8–14
const MOVE_Y_THRESHOLD = 14; // prevents blocking vertical scrolling taps

function RightActions({
  progress,
  dragX,
  onEdit,
  onDelete,
}: {
  progress: Animated.SharedValue<number>;
  dragX: Animated.SharedValue<number>;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const animStyle = useAnimatedStyle(() => {
    const x = interpolate(-dragX.value, [0, 160], [40, 0]);
    const opacity = interpolate(progress.value, [0, 1], [0.2, 1]);
    return { transform: [{ translateX: x }], opacity };
  });

  return (
    <Animated.View style={[styles.actionsWrap, animStyle]}>
      <Pressable style={[styles.actionBtn, styles.editBtn]} onPress={onEdit}>
        <Ionicons name="create-outline" size={20} color="#fff" />
        <Text style={styles.actionText}>Edit</Text>
      </Pressable>

      <Pressable
        style={[styles.actionBtn, styles.deleteBtn]}
        onPress={onDelete}
      >
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Text style={styles.actionText}>Delete</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function TransactionItem({
  item,
  onPress,
  onEdit,
  onDelete,
  onSwipeOpen,
}: Props) {
  const swipeRef = useRef<any>(null);

  // open state (JS ref)
  const isOpenRef = useRef(false);

  // tap suppression (works even for partial swipes that never "open")
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const movedRef = useRef(false);
  const suppressPressRef = useRef(false);

  const close = () => swipeRef.current?.close?.();

  const meta = getCategoryMeta(item.category);
  const isIncome = item.type === "income";

  const date = new Date(item.date);
  const dateLabel = `${date.getDate()} ${date.toLocaleString("en-US", {
    month: "short",
  })}`;

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      friction={0.85} // smooth/easy
      rightThreshold={30} // easy to open
      overshootRight={false}
      onSwipeableOpen={() => {
        isOpenRef.current = true;

        // block the "release tap" right after opening
        suppressPressRef.current = true;
        onSwipeOpen?.(swipeRef.current);

        setTimeout(() => {
          suppressPressRef.current = false;
        }, 250);
      }}
      onSwipeableClose={() => {
        isOpenRef.current = false;

        // block immediate accidental tap right after close
        suppressPressRef.current = true;
        setTimeout(() => {
          suppressPressRef.current = false;
        }, 250);
      }}
      renderRightActions={(progress, dragX) => (
        <RightActions
          progress={progress}
          dragX={dragX}
          onEdit={() => {
            close();
            onEdit();
          }}
          onDelete={() => {
            Alert.alert("Delete transaction?", "This cannot be undone.", [
              { text: "Cancel", style: "cancel", onPress: () => close() },
              {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                  close();
                  await onDelete();
                },
              },
            ]);
          }}
        />
      )}
    >
      <Pressable
        onPressIn={(e) => {
          const { pageX, pageY } = e.nativeEvent;
          startXRef.current = pageX;
          startYRef.current = pageY;
          movedRef.current = false;
          // do NOT reset suppressPressRef here; it might be active from swipe open/close
        }}
        onTouchMove={(e) => {
          const { pageX, pageY } = e.nativeEvent;
          const dx = pageX - startXRef.current;
          const dy = pageY - startYRef.current;

          // Horizontal movement => treat as swipe interaction, suppress press
          if (
            Math.abs(dx) > MOVE_X_THRESHOLD &&
            Math.abs(dy) < MOVE_Y_THRESHOLD
          ) {
            movedRef.current = true;
            suppressPressRef.current = true;
          }
        }}
        onPress={() => {
          // If swipe motion happened (even partial), never navigate
          if (suppressPressRef.current || movedRef.current) return;

          // If actions are open, tap closes instead of navigating
          if (isOpenRef.current) {
            close();
            return;
          }

          // Normal tap -> details
          onPress();
        }}
        style={styles.row}
      >
        <View style={styles.iconWrap}>
          <View style={[styles.iconCircle, { backgroundColor: meta.color }]}>
            <Ionicons name={meta.icon as any} size={18} color="#fff" />
          </View>
        </View>

        <View style={styles.mid}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {item.category}
          </Text>
        </View>

        <View style={styles.right}>
          <Text
            style={[styles.amount, { color: isIncome ? "#34C759" : "#FF453A" }]}
          >
            {isIncome ? "+" : "-"}
            {formatMoney(item.amount)}
          </Text>
          <Text style={styles.sub}>{dateLabel}</Text>
        </View>
      </Pressable>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    height: ROW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1a1a1a",
    backgroundColor: "#000",
  },
  iconWrap: { width: 52, alignItems: "flex-start" },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  mid: { flex: 1, paddingRight: 10 },
  right: { width: 120, alignItems: "flex-end" },

  title: { color: "#fff", fontWeight: "900", fontSize: 15 },
  sub: { color: "#8b8b8b", marginTop: 2, fontSize: 12 },
  amount: { fontWeight: "900", fontSize: 14 },

  actionsWrap: {
    flexDirection: "row",
    height: ROW_HEIGHT,
    alignItems: "stretch",
  },
  actionBtn: { justifyContent: "center", alignItems: "center" },
  editBtn: { width: EDIT_W, backgroundColor: "#2b2b2b" },
  deleteBtn: { width: DELETE_W, backgroundColor: "#FF453A" },
  actionText: { color: "#fff", marginTop: 4, fontSize: 12, fontWeight: "900" },
});
