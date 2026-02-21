import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />

        <Stack.Screen
          name="add"
          options={{
            presentation: "modal",
            headerShown: true,
            title: "Add Transaction",
          }}
        />

        <Stack.Screen
          name="balance"
          options={{
            presentation: "modal",
            headerShown: true,
            title: "Financial Overview",
          }}
        />

        <Stack.Screen
          name="transaction/[id]"
          options={{ headerShown: true, title: "Transaction" }}
        />

        <Stack.Screen
          name="transaction/edit/[id]"
          options={{ headerShown: true, title: "Edit Transaction" }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
