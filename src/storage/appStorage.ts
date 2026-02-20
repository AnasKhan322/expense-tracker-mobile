import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "has_onboarded";

export async function setHasOnboarded() {
  await AsyncStorage.setItem(KEY, "true");
}

export async function getHasOnboarded(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEY);
  return v === "true";
}
