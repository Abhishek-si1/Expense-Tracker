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

// Only these two messages mean "your session token itself is invalid" —
// other 401s (wrong current password, wrong security answers) must NOT log the user out.
const SESSION_INVALID_MESSAGES = ["Not authenticated", "Invalid or expired token"];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.error;
    if (error?.response?.status === 401 && SESSION_INVALID_MESSAGES.includes(message)) {
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

export interface SecurityQuestionInput {
  question: string;
  answer: string;
}

export const signup = (data: {
  email: string;
  password: string;
  name?: string;
  securityQuestions: SecurityQuestionInput[];
}) => api.post<{ token: string; user: AuthUser }>("/auth/signup", data).then((r) => r.data);

export const changePassword = (data: { currentPassword: string; newPassword: string }) =>
  api.put<{ success: true }>("/auth/change-password", data).then((r) => r.data);

export const getSecurityQuestions = (email: string) =>
  api
    .post<{ questions: { id: string; question: string }[] }>("/auth/forgot-password/questions", {
      email,
    })
    .then((r) => r.data);

export const verifySecurityAnswers = (data: {
  email: string;
  answers: { questionId: string; answer: string }[];
}) => api.post<{ resetToken: string }>("/auth/forgot-password/verify", data).then((r) => r.data);

export const resetPassword = (data: { resetToken: string; newPassword: string }) =>
  api.post<{ success: true }>("/auth/reset-password", data).then((r) => r.data);

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