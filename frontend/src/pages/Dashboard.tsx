import { useEffect, useState } from "react";
import * as api from "../api/client";
import type { Budget, Category, CategoryTotal, SummaryTotals, Transaction, TrendPoint } from "../types";
import TransactionForm from "../components/TransactionForm";
import TransactionList from "../components/TransactionList";
import CategoryManager from "../components/CategoryManager";
import BudgetManager from "../components/BudgetManager";
import CategoryPieChart from "../components/charts/CategoryPieChart";
import MonthlyTrendChart from "../components/charts/MonthlyTrendChart";
import BudgetProgress from "../components/charts/BudgetProgress";
import type { AuthUser } from "../api/client";
import ThemeToggle from "../components/ThemeToggle";
import ChangePasswordForm from "../components/ChangePasswordForm";

const now = new Date();

interface Props {
  user: AuthUser | null;
  onLogout: () => void;
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: "up" | "down" | "neutral" }) {
  const accent =
    tone === "up" ? "border-l-ledger-green" : tone === "down" ? "border-l-ledger-rust" : "border-l-ink-600";
  const valueColor = tone === "up" ? "text-ledger-green" : tone === "down" ? "text-ledger-rust" : "text-ink-900";
  return (
    <div className={`rounded-card border border-ink-100 border-l-4 bg-white p-4 ${accent}`}>
      <div className="text-xs font-medium text-ink-400">{label}</div>
      <div className={`tabular mt-1 text-2xl font-semibold ${valueColor}`}>
        ₹{value.toFixed(2)}
      </div>
    </div>
  );
}

export default function Dashboard({ user, onLogout }: Props) {
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [summary, setSummary] = useState<{ current: SummaryTotals; previous: SummaryTotals } | null>(null);
  const [byCategory, setByCategory] = useState<CategoryTotal[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [tab, setTab] = useState<"transactions" | "categories" | "budgets" | "settings">("transactions");

  // Transaction list filters
  const [filterCategory, setFilterCategory] = useState("");
  const [filterType, setFilterType] = useState("");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  async function refreshAll() {
    const [cats, txs, buds, summ, cat, tr] = await Promise.all([
      api.getCategories(),
      api.getTransactions({
        month,
        year,
        pageSize: 50,
        categoryId: filterCategory || undefined,
        type: filterType || undefined,
        search: search || undefined,
      }),
      api.getBudgets(month, year),
      api.getSummary(month, year),
      api.getByCategory(month, year),
      api.getTrend(6),
    ]);
    setCategories(cats);
    setTransactions(txs.items);
    setBudgets(buds);
    setSummary(summ);
    setByCategory(cat);
    setTrend(tr);
  }

  useEffect(() => {
    refreshAll().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year, filterCategory, filterType, search]);

  async function handleCreateOrUpdate(data: {
    title: string;
    amount: number;
    type: "INCOME" | "EXPENSE";
    date: string;
    categoryId: string;
    notes?: string;
  }) {
    if (editing) {
      await api.updateTransaction(editing.id, data);
      setEditing(null);
    } else {
      await api.createTransaction(data);
    }
    await refreshAll();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this transaction?")) return;
    await api.deleteTransaction(id);
    await refreshAll();
  }

  const monthLabel = new Date(year, month - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const sortedTransactions = [...transactions].sort((a, b) => {
    const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
    return sortOrder === "asc" ? diff : -diff;
  });

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-lg font-semibold text-ink-900">Expense Tracker</h1>
          <div className="flex items-center gap-2 text-sm">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="flex-1 rounded-lg border border-ink-100 bg-white px-2 py-1.5 text-ink-700 sm:flex-none"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1, 1).toLocaleString("en-US", { month: "long" })}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-lg border border-ink-100 bg-white px-2 py-1.5 text-ink-700"
            >
              {[year - 1, year, year + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <span className="mx-1 hidden text-ink-400 sm:inline">|</span>
            <span className="hidden text-ink-600 sm:inline">{user?.email}</span>
            <ThemeToggle />
            <button
              onClick={onLogout}
              className="rounded-lg border border-ink-100 px-2 py-1.5 text-ink-700 hover:bg-ink-50"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label={`Income · ${monthLabel}`} value={summary?.current.income ?? 0} tone="up" />
          <StatCard label={`Expense · ${monthLabel}`} value={summary?.current.expense ?? 0} tone="down" />
          <StatCard
            label="Net"
            value={summary?.current.net ?? 0}
            tone={(summary?.current.net ?? 0) >= 0 ? "up" : "down"}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-card border border-ink-100 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-ink-600">Spending by category</h2>
            <CategoryPieChart data={byCategory} />
          </div>
          <div className="rounded-card border border-ink-100 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-ink-600">Income vs. expense, last 6 months</h2>
            <MonthlyTrendChart data={trend} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-card border border-ink-100 bg-white p-4 lg:col-span-2">
            <div className="mb-3 flex gap-4 overflow-x-auto border-b border-ink-100 text-sm font-medium text-ink-400">
              {(["transactions", "categories", "budgets", "settings"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`whitespace-nowrap pb-2 capitalize ${
                    tab === t ? "border-b-2 border-ink-700 text-ink-900" : ""
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {tab === "transactions" && (
              <div className="space-y-4">
                <TransactionForm
                  categories={categories}
                  onSubmit={handleCreateOrUpdate}
                  initial={editing}
                  onCancel={editing ? () => setEditing(null) : undefined}
                />

                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    placeholder="Search title/notes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="min-w-[160px] flex-1 rounded-lg border border-ink-100 bg-white px-2 py-1.5 text-sm text-ink-700"
                  />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="rounded-lg border border-ink-100 bg-white px-2 py-1.5 text-sm text-ink-700"
                  >
                    <option value="">All categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="rounded-lg border border-ink-100 bg-white px-2 py-1.5 text-sm text-ink-700"
                  >
                    <option value="">All types</option>
                    <option value="INCOME">Income</option>
                    <option value="EXPENSE">Expense</option>
                  </select>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as "desc" | "asc")}
                    className="rounded-lg border border-ink-100 bg-white px-2 py-1.5 text-sm text-ink-700"
                  >
                    <option value="desc">Newest first</option>
                    <option value="asc">Oldest first</option>
                  </select>
                </div>

                <TransactionList
                  transactions={sortedTransactions}
                  onEdit={setEditing}
                  onDelete={handleDelete}
                />
              </div>
            )}

            {tab === "categories" && (
              <CategoryManager
                categories={categories}
                onCreate={async (data) => {
                  await api.createCategory(data);
                  await refreshAll();
                }}
                onDelete={async (id) => {
                  await api.deleteCategory(id);
                  await refreshAll();
                }}
              />
            )}

            {tab === "budgets" && (
              <BudgetManager
                budgets={budgets}
                categories={categories}
                onSave={async ({ categoryId, amount }) => {
                  await api.upsertBudget({ categoryId, amount, month, year });
                  await refreshAll();
                }}
              />
            )}

            {tab === "settings" && <ChangePasswordForm />}
          </div>

          <div className="rounded-card border border-ink-100 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-ink-600">Budget progress</h2>
            <BudgetProgress budgets={budgets} />
          </div>
        </div>
      </main>
    </div>
  );
}