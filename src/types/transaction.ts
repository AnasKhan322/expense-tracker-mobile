import type { CategoryId } from "../data/categories";

export type TransactionType = "expense" | "income";

export type Transaction = {
  id: string;
  title: string;
  amount: number;
  category: CategoryId;
  type: TransactionType;

  date: string;
  createdAt: string;
  updatedAt: string;
};
