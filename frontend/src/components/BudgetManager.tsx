import { FormEvent, useState } from "react";
import type { Budget, Category } from "../types";

interface Props {
  budgets: Budget[];
  categories: Category[];
  onSave: (data: { categoryId: string; amount: number }) => Promise<void>;
}

export default function BudgetManager({ budgets, categories, onSave }: Props) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [amount, setAmount] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!categoryId || !amount) return;
    await onSave({ categoryId, amount: parseFloat(amount) });
    setAmount("");
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
        <select
          className="rounded-lg border border-ink-100 px-3 py-2 text-sm focus:border-ink-600 focus:outline-none"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          className="tabular w-32 rounded-lg border border-ink-100 px-3 py-2 text-sm focus:border-ink-600 focus:outline-none"
          placeholder="Budget amount"
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-lg bg-ink-700 px-3 py-2 text-sm font-medium text-white hover:bg-ink-900"
        >
          Set budget
        </button>
      </form>

      <ul className="divide-y divide-ink-100 text-sm">
        {budgets.map((b) => (
          <li key={b.id} className="flex items-center justify-between py-2">
            <span style={{ color: b.category.color }} className="font-medium">
              {b.category.name}
            </span>
            <span className="text-ink-400">₹{b.amount.toFixed(2)} / month</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
