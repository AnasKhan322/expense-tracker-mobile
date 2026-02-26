// app/settings.tsx
import React, { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useSettingsStore,
  type CurrencyCode,
} from "../src/store/settingsStore";

const options: { code: CurrencyCode; label: string }[] = [
  { code: "USD", label: "US Dollar (USD)" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "GBP", label: "British Pound (GBP)" },
  { code: "EGP", label: "Egyptian Pound (EGP)" },
  { code: "SAR", label: "Saudi Riyal (SAR)" },
  { code: "AED", label: "UAE Dirham (AED)" },
  { code: "BHD", label: "Bahraini Dinar (BHD)" },
  { code: "PKR", label: "Pakistani Rupee (PKR)" },
];

export default function Settings() {
  const currency = useSettingsStore((s) => s.currency);
  const hydrate = useSettingsStore((s) => s.hydrate);
  const setCurrency = useSettingsStore((s) => s.setCurrency);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
      <View style={{ padding: 18 }}>
        <Text
          style={{
            color: "white",
            fontSize: 22,
            fontWeight: "900",
            marginBottom: 16,
          }}
        >
          Settings
        </Text>

        <Text style={{ color: "#bbb", fontWeight: "900", marginBottom: 10 }}>
          Currency
        </Text>

        <View style={{ gap: 10 }}>
          {options.map((o) => {
            const active = o.code === currency;
            return (
              <Pressable
                key={o.code}
                onPress={() => setCurrency(o.code)}
                style={{
                  paddingVertical: 14,
                  paddingHorizontal: 14,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: active ? "#9DFF3A" : "#1b1b1b",
                  backgroundColor: "#0d0d0d",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", fontWeight: "900", flex: 1 }}>
                  {o.label}
                </Text>

                {active ? (
                  <Text style={{ color: "#9DFF3A", fontWeight: "900" }}>✓</Text>
                ) : (
                  <Text style={{ color: "#666", fontWeight: "900" }}>
                    {o.code}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}
