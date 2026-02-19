import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function Onboarding() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#000",
        padding: 24,
        justifyContent: "flex-end",
      }}
    >
      <Text
        style={{
          color: "white",
          fontSize: 28,
          fontWeight: "700",
          marginBottom: 10,
        }}
      >
        Always take control{"\n"}of your finances
      </Text>
      <Text style={{ color: "#aaa", marginBottom: 20 }}>
        Track expenses and income, and see your balance instantly.
      </Text>

      <Pressable
        onPress={() => router.replace("/(tabs)")}
        style={{ backgroundColor: "#9DFF3A", padding: 14, borderRadius: 12 }}
      >
        <Text style={{ textAlign: "center", fontWeight: "700" }}>
          Get Started
        </Text>
      </Pressable>
    </View>
  );
}
