"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BuilderProps } from "./index";

type Item = { id: string; word: string; category: string };

function createItem(overrides?: Partial<Item>): Item {
  return { id: `cs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, word: "", category: "", ...overrides };
}

/** Builder for CATEGORY_SORT: category buckets + word→category assignments. */
export function CategorySortBuilder({ onChange, initial, onValidation }: BuilderProps) {
  const [categories, setCategories] = useState<string[]>(
    (initial?.sortCategories as string[]) || []
  );
  const [items, setItems] = useState<Item[]>(
    ((initial?.sortItems as Item[]) || []).map((i) => ({ ...i }))
  );
  const [catText, setCatText] = useState(categories.join(", "));

  useEffect(() => {
    const cats = catText.split(",").map((s) => s.trim()).filter(Boolean);
    setCategories(cats);
    const valid = cats.length >= 2 && items.length >= 3 && items.every((i) => i.word.trim() && cats.includes(i.category));
    onValidation?.(valid);
    onChange({ sortCategories: cats, sortItems: items });
  }, [catText, items, onValidation]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateItem = (id: string, patch: Partial<Item>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-txt-secondary">
          Categories (comma separated)
        </label>
        <Input value={catText} onChange={(e) => setCatText(e.target.value)} placeholder="Kitchen, Travel, Office" />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-txt-secondary">
          Words to sort
        </label>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <Input
                value={item.word}
                onChange={(e) => updateItem(item.id, { word: e.target.value })}
                placeholder="word"
                className="flex-1"
              />
              <select
                value={item.category}
                onChange={(e) => updateItem(item.id, { category: e.target.value })}
                className="rounded-btn border border-border bg-card px-2 py-2 text-sm"
              >
                <option value="">Category…</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button type="button" onClick={() => setItems((p) => p.filter((i) => i.id !== item.id))} className="text-error">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setItems((p) => [...p, createItem()])}>
          <Plus className="mr-1 h-4 w-4" /> Add word
        </Button>
      </div>
    </div>
  );
}
