// src/components/categoryGrid.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { CategoryId, CategoryMeta } from "../data/categories";

function CategoryGrid({
  categories = [],
  selected,
  onSelect,
}: {
  categories?: CategoryMeta[];
  selected: CategoryId | string;
  onSelect: (key: CategoryId) => void;
}) {
  return (
    <View style={styles.grid}>
      {categories.map((c) => {
        const active = selected === c.key;

        return (
          <Pressable
            key={c.key}
            onPress={() => onSelect(c.key)}
            style={[styles.card, active && styles.cardActive]}
          >
            <View style={[styles.iconWrap, { backgroundColor: c.color }]}>
              <Ionicons name={c.icon} size={22} color="#fff" />
            </View>

            <Text style={styles.label} numberOfLines={1}>
              {c.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default React.memo(CategoryGrid);

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    marginTop: 4,
  },
  card: {
    width: "31.5%",
    backgroundColor: "#141414",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 110,
    borderWidth: 1,
    borderColor: "#141414",
  },
  cardActive: {
    borderColor: "#9DFF3A",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  label: {
    color: "white",
    fontWeight: "900",
    textAlign: "center",
  },
});
