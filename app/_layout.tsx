import { Stack } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSettingsStore } from "../src/store/settingsStore";
import { useTransactionsStore } from "../src/store/transactionsStore";

function StoreHydrator() {
  const hydrateTx = useTransactionsStore((s) => s.hydrate);
  const hydratedTx = useTransactionsStore((s) => s.hydrated);

  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const hydratedSettings = useSettingsStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydratedTx) hydrateTx();
  }, [hydratedTx, hydrateTx]);

  useEffect(() => {
    if (!hydratedSettings) hydrateSettings();
  }, [hydratedSettings, hydrateSettings]);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StoreHydrator />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, title: "Home" }}
        />

        <Stack.Screen
          name="settings"
          options={{
            headerShown: true,
            title: "Settings",
            headerBackTitle: "",
          }}
        />
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
        <Stack.Screen name="category/[name]" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
