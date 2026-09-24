import { FormEvent, useState } from "react";
import type { Category, Transaction, TransactionType } from "../types";

interface Props {
  categories: Category[];
  onSubmit: (data: {
    title: string;
    amount: number;
    type: TransactionType;
    date: string;
    categoryId: string;
    notes?: string;
  }) => Promise<void>;
  initial?: Transaction | null;
  onCancel?: () => void;
}

export default function TransactionForm({ categories, onSubmit, initial, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [type, setType] = useState<TransactionType>(initial?.type ?? "EXPENSE");
  const [date, setDate] = useState(
    initial ? initial.date.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title || !amount || !categoryId) return;
    setSubmitting(true);
    try {
      await onSubmit({
        title,
        amount: parseFloat(amount),
        type,
        date,
        categoryId,
        notes: notes || undefined,
      });
      if (!initial) {
        setTitle("");
        setAmount("");
        setNotes("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <input
        className="rounded-lg border border-ink-100 px-3 py-2 text-sm focus:border-ink-600 focus:outline-none"
        placeholder="Title (e.g. Groceries)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <input
        className="tabular rounded-lg border border-ink-100 px-3 py-2 text-sm focus:border-ink-600 focus:outline-none"
        placeholder="Amount"
        type="number"
        step="0.01"
        min="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />
      <select
        className="rounded-lg border border-ink-100 px-3 py-2 text-sm focus:border-ink-600 focus:outline-none"
        value={type}
        onChange={(e) => setType(e.target.value as TransactionType)}
      >
        <option value="EXPENSE">Expense</option>
        <option value="INCOME">Income</option>
      </select>
      <select
        className="rounded-lg border border-ink-100 px-3 py-2 text-sm focus:border-ink-600 focus:outline-none"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        required
      >
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <input
        className="rounded-lg border border-ink-100 px-3 py-2 text-sm focus:border-ink-600 focus:outline-none"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />
      <input
        className="rounded-lg border border-ink-100 px-3 py-2 text-sm focus:border-ink-600 focus:outline-none sm:col-span-2"
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="flex gap-2 sm:col-span-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-ink-700 px-4 py-2 text-sm font-medium text-white hover:bg-ink-900 disabled:opacity-50"
        >
          {initial ? "Save changes" : "Add transaction"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-ink-100 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
