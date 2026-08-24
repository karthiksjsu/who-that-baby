"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import type { Baby } from "@/types/db";

export function BabyList({
  babies,
  onChange,
}: {
  babies: Baby[];
  onChange: (babies: Baby[]) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function persistOrder(next: Baby[]) {
    onChange(next);
    await fetch("/api/admin/babies/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: next.map((b) => b.id) }),
    }).catch(() => toast.error("Couldn't save the new order."));
  }

  function move(id: string, direction: -1 | 1) {
    const index = babies.findIndex((b) => b.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= babies.length) return;
    const next = [...babies];
    [next[index], next[target]] = [next[target], next[index]];
    persistOrder(next);
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/babies/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed.");
      onChange(babies.filter((b) => b.id !== id));
    } catch {
      toast.error("Couldn't delete that baby.");
    } finally {
      setBusyId(null);
    }
  }

  async function saveEdit(id: string) {
    const value = editingValue.trim();
    setEditingId(null);
    if (!value) return;
    const res = await fetch(`/api/admin/babies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correct_name: value }),
    });
    if (!res.ok) {
      toast.error("Couldn't rename that baby.");
      return;
    }
    onChange(babies.map((b) => (b.id === id ? { ...b, correct_name: value } : b)));
  }

  if (babies.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No babies added yet. Upload your first photo to the left!
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {babies.map((baby, i) => (
        <li
          key={baby.id}
          className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={baby.photo_url}
            alt={baby.correct_name}
            className="size-14 shrink-0 rounded-xl object-cover"
          />

          {editingId === baby.id ? (
            <Input
              autoFocus
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={() => saveEdit(baby.id)}
              onKeyDown={(e) => e.key === "Enter" && saveEdit(baby.id)}
              className="h-9 flex-1"
            />
          ) : (
            <button
              type="button"
              className="flex-1 truncate text-left font-medium hover:underline"
              onClick={() => {
                setEditingId(baby.id);
                setEditingValue(baby.correct_name);
              }}
            >
              {baby.correct_name}
            </button>
          )}

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={i === 0}
              onClick={() => move(baby.id, -1)}
            >
              <ArrowUp className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={i === babies.length - 1}
              onClick={() => move(baby.id, 1)}
            >
              <ArrowDown className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={busyId === baby.id}
              onClick={() => handleDelete(baby.id)}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
