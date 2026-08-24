"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowDown, ArrowRightLeft, ArrowUp, Check, Trash2, X } from "lucide-react";
import type { Baby } from "@/types/db";

export function BabyList({
  babies,
  emptyLabel,
  moveLabel,
  showClue,
  onChange,
  onMoveRound,
}: {
  babies: Baby[];
  emptyLabel: string;
  moveLabel: string;
  showClue: boolean;
  onChange: (babies: Baby[]) => void;
  onMoveRound: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editClue, setEditClue] = useState("");
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

  function startEdit(baby: Baby) {
    setEditingId(baby.id);
    setEditName(baby.correct_name);
    setEditClue(baby.clue ?? "");
  }

  async function saveEdit(id: string) {
    const name = editName.trim();
    if (!name) return;
    const clue = editClue.trim();
    const res = await fetch(`/api/admin/babies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(showClue ? { correct_name: name, clue } : { correct_name: name }),
    });
    if (!res.ok) {
      toast.error("Couldn't save that baby.");
      return;
    }
    onChange(
      babies.map((b) =>
        b.id === id ? { ...b, correct_name: name, ...(showClue ? { clue: clue || null } : {}) } : b
      )
    );
    setEditingId(null);
  }

  if (babies.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        {emptyLabel}
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
            <div className="flex flex-1 flex-col gap-1.5">
              <Input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveEdit(baby.id)}
                placeholder="Name"
                className="h-9"
              />
              {showClue && (
                <Input
                  value={editClue}
                  onChange={(e) => setEditClue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit(baby.id)}
                  placeholder="Clue (optional)"
                  maxLength={140}
                  className="h-9"
                />
              )}
            </div>
          ) : (
            <button
              type="button"
              className="flex flex-1 flex-col items-start truncate text-left"
              onClick={() => startEdit(baby)}
            >
              <span className="font-medium hover:underline">{baby.correct_name}</span>
              {showClue && (
                <span className="truncate text-xs text-muted-foreground">
                  {baby.clue || "Add a clue"}
                </span>
              )}
            </button>
          )}

          <div className="flex items-center gap-1">
            {editingId === baby.id ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => saveEdit(baby.id)}
                >
                  <Check className="size-4 text-emerald-600" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setEditingId(null)}
                >
                  <X className="size-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  title={moveLabel}
                  onClick={() => onMoveRound(baby.id)}
                >
                  <ArrowRightLeft className="size-4" />
                </Button>
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
              </>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
