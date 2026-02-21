import AsyncStorage from "@react-native-async-storage/async-storage";
import { Transaction } from "../types/transaction";

const STORAGE_KEY = "transactions";

export async function getTransactions(): Promise<Transaction[]> {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}
export async function getTransactionById(
  id: string,
): Promise<Transaction | null> {
  const items = await getTransactions();
  return items.find((t) => t.id === id) ?? null;
}
export async function updateTransaction(
  updated: Transaction,
): Promise<Transaction[]> {
  const items = await getTransactions();
  const next = items.map((t) => (t.id === updated.id ? updated : t));
  await saveTransactions(next);
  return next;
}

export async function saveTransactions(items: Transaction[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export async function deleteTransaction(id: string): Promise<Transaction[]> {
  const items = await getTransactions();
  const next = items.filter((t) => t.id !== id);
  await saveTransactions(next);
  return next;
}
