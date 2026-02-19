import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="add"
        options={{
          presentation: "modal",
          headerShown: true,
          title: "Add Transaction",
        }}
      />
    </Stack>
  );
}
