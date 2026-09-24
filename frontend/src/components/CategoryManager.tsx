import { FormEvent, useState } from "react";
import type { Category } from "../types";

interface Props {
  categories: Category[];
  onCreate: (data: { name: string; color: string; icon: string }) => Promise<void>;
  onDelete: (id: string) => void;
}

const PALETTE = ["#6366f1", "#f97316", "#22c55e", "#ec4899", "#06b6d4", "#eab308", "#8b5cf6", "#ef4444"];

export default function CategoryManager({ categories, onCreate, onDelete }: Props) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PALETTE[0]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await onCreate({ name: name.trim(), color, icon: "tag" });
    setName("");
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
        <input
          className="flex-1 min-w-[140px] rounded-lg border border-ink-100 px-3 py-2 text-sm focus:border-ink-600 focus:outline-none"
          placeholder="New category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="flex gap-1">
          {PALETTE.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setColor(c)}
              className={`h-6 w-6 rounded-full border-2 ${color === c ? "border-ink-900" : "border-transparent"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <button
          type="submit"
          className="rounded-lg bg-ink-700 px-3 py-2 text-sm font-medium text-white hover:bg-ink-900"
        >
          Add
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <span
            key={c.id}
            className="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
            style={{ backgroundColor: `${c.color}20`, color: c.color }}
          >
            {c.name}
            {c._count?.transactions === 0 && (
              <button onClick={() => onDelete(c.id)} className="text-ink-400 hover:text-red-500">
                ×
              </button>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
