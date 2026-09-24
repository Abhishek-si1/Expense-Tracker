import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { CategoryTotal } from "../../types";

export default function CategoryPieChart({ data }: { data: CategoryTotal[] }) {
  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-ink-400">
        No expenses recorded for this month yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="name"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
        >
          {data.map((entry) => (
            <Cell key={entry.categoryId} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [`₹${value.toFixed(2)}`, "Spent"]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
