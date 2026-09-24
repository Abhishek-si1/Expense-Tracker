export type TransactionType = "INCOME" | "EXPENSE";

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  _count?: { transactions: number };
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  date: string;
  notes?: string | null;
  categoryId: string;
  category: Category;
}

export interface Budget {
  id: string;
  categoryId: string;
  category: Category;
  amount: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  month: number;
  year: number;
}

export interface SummaryTotals {
  income: number;
  expense: number;
  net: number;
}

export interface CategoryTotal {
  categoryId: string;
  name: string;
  color: string;
  total: number;
}

export interface TrendPoint {
  label: string;
  income: number;
  expense: number;
}
