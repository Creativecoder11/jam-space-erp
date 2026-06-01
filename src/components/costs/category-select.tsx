"use client";

import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type Category = { id: string; name: string; color?: string };

function loadCategories(storageKey: string, defaults: Category[]): Category[] {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return defaults;
    const custom: Category[] = JSON.parse(raw);
    // merge: defaults first, then any custom ones not already in defaults
    const defaultIds = new Set(defaults.map(d => d.id));
    return [...defaults, ...custom.filter(c => !defaultIds.has(c.id))];
  } catch {
    return defaults;
  }
}

function saveCustomCategories(storageKey: string, defaults: Category[], all: Category[]) {
  const defaultIds = new Set(defaults.map(d => d.id));
  const custom = all.filter(c => !defaultIds.has(c.id));
  localStorage.setItem(storageKey, JSON.stringify(custom));
}

interface CategorySelectProps {
  storageKey: string;
  defaults: Category[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function CategorySelect({
  storageKey, defaults, value: controlledValue, onValueChange, placeholder = "Select category",
}: CategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>(() => loadCategories(storageKey, defaults));
  const [selected, setSelected] = useState<string | undefined>(controlledValue);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [open, setOpen] = useState(false);

  // Sync if parent resets the controlled value (e.g. form reset)
  useEffect(() => {
    setSelected(controlledValue);
  }, [controlledValue]);

  useEffect(() => {
    setCategories(loadCategories(storageKey, defaults));
  }, [storageKey, defaults]);

  const pick = (id: string) => {
    setSelected(id);
    setOpen(false);
    onValueChange(id);
  };

  const handleSelect = (val: string) => {
    if (val === "__add__") { setAdding(true); return; }
    pick(val);
  };

  const commitNew = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const id = trimmed.toLowerCase().replace(/\s+/g, "_");
    if (categories.some(c => c.id === id || c.name.toLowerCase() === trimmed.toLowerCase())) {
      pick(id);
      setAdding(false);
      setNewName("");
      return;
    }
    const newCat: Category = { id, name: trimmed };
    const updated = [...categories, newCat];
    setCategories(updated);
    saveCustomCategories(storageKey, defaults, updated);
    pick(id);
    setAdding(false);
    setNewName("");
  };

  const cancelNew = () => { setAdding(false); setNewName(""); };

  const selectedName = categories.find(c => c.id === selected)?.name;

  return (
    <div>
      <Select open={open} onOpenChange={setOpen} value={selected ?? ""} onValueChange={handleSelect}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder}>
            {selectedName ?? <span className="text-muted-foreground">{placeholder}</span>}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {categories.map(c => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
          <SelectItem value="__add__" className="text-primary font-medium border-t mt-1 pt-2">
            <span className="flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add new category
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      {adding && (
        <div className="mt-2 flex items-center gap-2">
          <Input
            autoFocus
            placeholder="New category name..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); commitNew(); } if (e.key === "Escape") cancelNew(); }}
            className="h-8 text-sm"
          />
          <Button type="button" size="sm" className="h-8 px-3" onClick={commitNew}>Add</Button>
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={cancelNew}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
