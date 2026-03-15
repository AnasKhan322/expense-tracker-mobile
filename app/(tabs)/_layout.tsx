import { Ionicons } from "@expo/vector-icons";
import { Tabs, router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { useSettingsStore } from "../../src/store/settingsStore";
import { useTransactionsStore } from "../../src/store/transactionsStore";

export default function TabsLayout() {
  const settingsHydrated = useSettingsStore((s) => s.hydrated);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);

  const txHydrate = useTransactionsStore((s) => s.hydrate);

  const limits = useSettingsStore((s) => s.limits);
  const needsReview = useSettingsStore((s) => s.needsLimitsReview);
  const acknowledge = useSettingsStore((s) => s.acknowledgeLimitsReview);

  const [promptOpen, setPromptOpen] = useState(false);

  const hasLimits = useMemo(
    () => Object.keys(limits ?? {}).length > 0,
    [limits],
  );

  // Hydrate stores once (tabs-level)
  useEffect(() => {
    hydrateSettings();
    txHydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show prompt only after settings hydrated
  useEffect(() => {
    if (!settingsHydrated) return;

    if (hasLimits && needsReview) {
      setPromptOpen(true);
    } else {
      setPromptOpen(false);
    }
  }, [settingsHydrated, hasLimits, needsReview]);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#0b0b0b",
            borderTopColor: "#151515",
          },
          tabBarActiveTintColor: "#9DFF3A",
          tabBarInactiveTintColor: "#666",
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="stats"
          options={{
            title: "Stats",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="stats-chart-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="limits"
          options={{
            title: "Limits",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="speedometer-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* Global monthly limits prompt */}
      <Modal
        visible={promptOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setPromptOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.65)",
            justifyContent: "center",
            padding: 18,
          }}
        >
          {/* Block touches behind */}
          <Pressable
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />

          <View
            style={{
              backgroundColor: "#0b0b0b",
              borderRadius: 22,
              borderWidth: 1,
              borderColor: "#151515",
              padding: 16,
            }}
          >
            <Text style={{ color: "white", fontWeight: "900", fontSize: 18 }}>
              New month started
            </Text>

            <Text
              style={{
                color: "#9a9a9a",
                fontWeight: "800",
                marginTop: 8,
                lineHeight: 18,
              }}
            >
              Do you want to keep last month’s limits or review and update them?
            </Text>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <Pressable
                onPress={async () => {
                  await acknowledge();
                  setPromptOpen(false);
                }}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 16,
                  backgroundColor: "#141414",
                  borderWidth: 1,
                  borderColor: "#222",
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Text
                  style={{
                    textAlign: "center",
                    fontWeight: "900",
                    color: "#bbb",
                  }}
                >
                  Keep
                </Text>
              </Pressable>

              <Pressable
                onPress={async () => {
                  await acknowledge();
                  setPromptOpen(false);

                  // ✅ IMPORTANT: go to the tabs route explicitly
                  router.push("/(tabs)/limits");
                }}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 16,
                  backgroundColor: "#9DFF3A",
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Text
                  style={{
                    textAlign: "center",
                    fontWeight: "900",
                    color: "#111",
                  }}
                >
                  Review
                </Text>
              </Pressable>
            </View>

            <Text
              style={{
                color: "#666",
                fontWeight: "800",
                marginTop: 12,
                fontSize: 12,
              }}
            >
              You can always change limits later in the Limits tab.
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}
