import axios from "axios";
import type {
  Budget,
  Category,
  CategoryTotal,
  SummaryTotals,
  Transaction,
  TrendPoint,
} from "../types";

// In dev, Vite proxies /api to localhost:4000 (see vite.config.ts).
// In production there's no proxy, so VITE_API_URL must point at the deployed backend.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api" });

// Attach the stored token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token is invalid/expired, clear it and force back to the login screen
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Auth
export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
}

export const signup = (data: { email: string; password: string; name?: string }) =>
  api.post<{ token: string; user: AuthUser }>("/auth/signup", data).then((r) => r.data);

export const login = (data: { email: string; password: string }) =>
  api.post<{ token: string; user: AuthUser }>("/auth/login", data).then((r) => r.data);

// Categories
export const getCategories = () =>
  api.get<Category[]>("/categories").then((r) => r.data);
export const createCategory = (data: Partial<Category>) =>
  api.post<Category>("/categories", data).then((r) => r.data);
export const updateCategory = (id: string, data: Partial<Category>) =>
  api.put<Category>(`/categories/${id}`, data).then((r) => r.data);
export const deleteCategory = (id: string) =>
  api.delete(`/categories/${id}`);

// Transactions
export interface TransactionQuery {
  month?: number;
  year?: number;
  categoryId?: string;
  type?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}
export const getTransactions = (query: TransactionQuery) =>
  api
    .get<{ items: Transaction[]; total: number; page: number; pageSize: number }>(
      "/transactions",
      { params: query }
    )
    .then((r) => r.data);
export const createTransaction = (data: Partial<Transaction>) =>
  api.post<Transaction>("/transactions", data).then((r) => r.data);
export const updateTransaction = (id: string, data: Partial<Transaction>) =>
  api.put<Transaction>(`/transactions/${id}`, data).then((r) => r.data);
export const deleteTransaction = (id: string) =>
  api.delete(`/transactions/${id}`);

// Budgets
export const getBudgets = (month: number, year: number) =>
  api.get<Budget[]>("/budgets", { params: { month, year } }).then((r) => r.data);
export const upsertBudget = (data: {
  categoryId: string;
  amount: number;
  month: number;
  year: number;
}) => api.post<Budget>("/budgets", data).then((r) => r.data);
export const deleteBudget = (id: string) => api.delete(`/budgets/${id}`);

// Analytics
export const getSummary = (month: number, year: number) =>
  api
    .get<{ current: SummaryTotals; previous: SummaryTotals }>("/analytics/summary", {
      params: { month, year },
    })
    .then((r) => r.data);
export const getByCategory = (month: number, year: number) =>
  api
    .get<CategoryTotal[]>("/analytics/by-category", { params: { month, year } })
    .then((r) => r.data);
export const getTrend = (months = 6) =>
  api.get<TrendPoint[]>("/analytics/trend", { params: { months } }).then((r) => r.data);