import { Stack } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useTransactionsStore } from "../src/store/transactionsStore";

function StoreHydrator() {
  const hydrate = useTransactionsStore((s) => s.hydrate);
  const hydrated = useTransactionsStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StoreHydrator />
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
