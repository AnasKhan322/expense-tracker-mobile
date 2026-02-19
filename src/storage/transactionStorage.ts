import AsyncStorage from "@react-native-async-storage/async-storage";
import { Transaction } from "../types/transaction";

const STORAGE_KEY = "transactions";

export async function getTransactions(): Promise<Transaction[]> {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveTransactions(items: Transaction[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
