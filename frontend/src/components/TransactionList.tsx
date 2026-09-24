import type { Transaction } from "../types";

interface Props {
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
}

function AmountTag({ t }: { t: Transaction }) {
  const isIncome = t.type === "INCOME";
  return (
    <span className={`tabular font-semibold ${isIncome ? "text-ledger-green" : "text-ledger-rust"}`}>
      {isIncome ? "+" : "−"}₹{Number(t.amount).toFixed(2)}
    </span>
  );
}

function CategoryTag({ t }: { t: Transaction }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${t.category.color}1a`, color: t.category.color }}
    >
      {t.category.name}
    </span>
  );
}

export default function TransactionList({ transactions, onEdit, onDelete }: Props) {
  if (!transactions.length) {
    return (
      <div className="py-8 text-center text-sm text-ink-400">
        No transactions match your filters yet. Add one above to get started.
      </div>
    );
  }

  return (
    <>
      {/* Mobile: stacked cards */}
      <ul className="divide-y divide-ink-100 sm:hidden">
        {transactions.map((t) => (
          <li key={t.id} className="flex items-start justify-between gap-3 py-3">
            <div className="min-w-0">
              <div className="truncate font-medium text-ink-900">{t.title}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <CategoryTag t={t} />
                <span className="text-xs text-ink-400">{new Date(t.date).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 text-right">
              <AmountTag t={t} />
              <div className="flex gap-2 text-xs">
                <button onClick={() => onEdit(t)} className="font-medium text-ink-600 underline-offset-2 hover:underline">
                  Edit
                </button>
                <button onClick={() => onDelete(t.id)} className="font-medium text-ledger-rust underline-offset-2 hover:underline">
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop / tablet: table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-ink-400">
              <th className="py-2 font-medium">Title</th>
              <th className="py-2 font-medium">Category</th>
              <th className="py-2 font-medium">Date</th>
              <th className="py-2 font-medium text-right">Amount</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b border-ink-50 last:border-0">
                <td className="py-2.5">
                  <div className="font-medium text-ink-900">{t.title}</div>
                  {t.notes && <div className="text-xs text-ink-400">{t.notes}</div>}
                </td>
                <td className="py-2.5">
                  <CategoryTag t={t} />
                </td>
                <td className="py-2.5 text-ink-400">{new Date(t.date).toLocaleDateString()}</td>
                <td className="py-2.5 text-right">
                  <AmountTag t={t} />
                </td>
                <td className="py-2.5 text-right">
                  <button
                    onClick={() => onEdit(t)}
                    className="mr-3 text-xs font-medium text-ink-600 underline-offset-2 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(t.id)}
                    className="text-xs font-medium text-ledger-rust underline-offset-2 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
