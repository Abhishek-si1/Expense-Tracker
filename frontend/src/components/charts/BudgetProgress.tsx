import type { Budget } from "../../types";

export default function BudgetProgress({ budgets }: { budgets: Budget[] }) {
  if (!budgets.length) {
    return (
      <div className="text-sm text-ink-400">
        No budgets set for this month yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {budgets.map((b) => {
        const pct = Math.min(b.percentUsed, 100);
        const over = b.percentUsed > 100;
        return (
          <div key={b.id}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium" style={{ color: b.category.color }}>
                {b.category.name}
              </span>
              <span className={over ? "text-red-600" : "text-ink-400"}>
                ₹{b.spent.toFixed(0)} / ₹{b.amount.toFixed(0)}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-ink-50">
              <div
                className={`h-2 rounded-full ${over ? "bg-ledger-rust" : "bg-ledger-green"}`}
                style={{ width: `${pct}%`, backgroundColor: over ? undefined : b.category.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
