"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowDown,
  ArrowRightLeft,
  ArrowUp,
  Check,
  Crop,
  ListChecks,
  Trash2,
  X,
} from "lucide-react";
import { PhotoCropper } from "@/components/admin/PhotoCropper";
import { buildChoices } from "@/lib/game/distractors";
import type { Baby } from "@/types/db";

export function BabyList({
  babies,
  emptyLabel,
  moveLabel,
  showClue,
  showOptions,
  allNames,
  choicesCount,
  onChange,
  onMoveRound,
}: {
  babies: Baby[];
  emptyLabel: string;
  moveLabel: string;
  showClue: boolean;
  /** Only the multiple-choice round has options to pick. */
  showOptions: boolean;
  /** Every baby's name, including the ones in the other round. */
  allNames: string[];
  choicesCount: number;
  onChange: (babies: Baby[]) => void;
  onMoveRound: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editClue, setEditClue] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  /** At most one panel is open at a time — the rows are small. */
  const [panel, setPanel] = useState<{ id: string; kind: "frame" | "options" } | null>(null);

  function togglePanel(id: string, kind: "frame" | "options") {
    setPanel((prev) => (prev?.id === id && prev.kind === kind ? null : { id, kind }));
  }

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

  async function saveFraming(baby: Baby, file: File) {
    setBusyId(baby.id);
    try {
      const form = new FormData();
      form.set("photo", file);
      const res = await fetch(`/api/admin/babies/${baby.id}/photo`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save that framing.");
      onChange(babies.map((b) => (b.id === baby.id ? (data.baby as Baby) : b)));
      setPanel(null);
      toast.success("Photo reframed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save that framing.");
    } finally {
      setBusyId(null);
    }
  }

  async function saveOptions(baby: Baby, distractors: string[] | null) {
    setBusyId(baby.id);
    try {
      const res = await fetch(`/api/admin/babies/${baby.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ distractors }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save those options.");
      onChange(babies.map((b) => (b.id === baby.id ? (data.baby as Baby) : b)));
      setPanel(null);
      toast.success(distractors ? "Options saved." : "Back to suggested options.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save those options.");
    } finally {
      setBusyId(null);
    }
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
        <li key={baby.id} className="rounded-2xl border border-border bg-white p-3">
          <div className="flex items-center gap-3">
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
                {showOptions && baby.distractors?.length ? (
                  <span className="truncate text-xs text-muted-foreground">
                    Options: {baby.distractors.join(", ")}
                  </span>
                ) : null}
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
                    title="Reframe photo"
                    onClick={() => togglePanel(baby.id, "frame")}
                  >
                    <Crop className="size-4" />
                  </Button>
                  {showOptions && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      title="Answer options"
                      onClick={() => togglePanel(baby.id, "options")}
                    >
                      <ListChecks className="size-4" />
                    </Button>
                  )}
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
          </div>

          {panel?.id === baby.id && panel.kind === "frame" && (
            <div className="mt-3 border-t border-border pt-3">
              <PhotoCropper
                key={baby.photo_url}
                src={baby.photo_url}
                busy={busyId === baby.id}
                confirmLabel={busyId === baby.id ? "Saving…" : "Save framing"}
                onCancel={() => setPanel(null)}
                onCropped={(file) => saveFraming(baby, file)}
              />
            </div>
          )}

          {panel?.id === baby.id && panel.kind === "options" && (
            <OptionsEditor
              baby={baby}
              allNames={allNames}
              choicesCount={choicesCount}
              busy={busyId === baby.id}
              onCancel={() => setPanel(null)}
              onSave={(distractors) => saveOptions(baby, distractors)}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * Picks the wrong answers for one card.
 *
 * It opens on the set the game would have chosen by itself, so the host can
 * glance and close, or swap the one name that gives the answer away. Saving
 * pins whatever is in the boxes; clearing them all hands the card back to the
 * generator, which is also what the reset button does.
 */
function OptionsEditor({
  baby,
  allNames,
  choicesCount,
  busy,
  onCancel,
  onSave,
}: {
  baby: Baby;
  allNames: string[];
  choicesCount: number;
  busy: boolean;
  onCancel: () => void;
  onSave: (distractors: string[] | null) => void;
}) {
  const slots = Math.max(1, choicesCount - 1);
  const suggested = buildChoices(baby.correct_name, allNames, choicesCount, baby.id).filter(
    (n) => n !== baby.correct_name
  );
  const [values, setValues] = useState<string[]>(() =>
    Array.from({ length: slots }, (_, i) => baby.distractors?.[i] ?? suggested[i] ?? "")
  );
  const listId = `names-${baby.id}`;
  const others = Array.from(new Set(allNames.filter((n) => n !== baby.correct_name)));

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
      <p className="text-sm font-medium">
        Options for this photo
        {baby.distractors?.length ? "" : " (suggested)"}
      </p>

      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        <Check className="size-4 shrink-0" />
        <span className="truncate">{baby.correct_name}</span>
        <span className="ml-auto shrink-0 text-xs">the answer</span>
      </div>

      <datalist id={listId}>
        {others.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      {values.map((value, i) => (
        <Input
          key={i}
          value={value}
          list={listId}
          maxLength={80}
          placeholder={`Wrong answer ${i + 1}`}
          onChange={(e) =>
            setValues((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))
          }
          className="h-9"
        />
      ))}

      <p className="text-xs text-muted-foreground">
        Pick from the names you have uploaded, or type anyone you like. They are shuffled with
        the answer for every player.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="h-9"
          disabled={busy}
          onClick={() => onSave(values.map((v) => v.trim()).filter(Boolean))}
        >
          {busy ? "Saving…" : "Save options"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-9"
          disabled={busy || !baby.distractors?.length}
          onClick={() => onSave(null)}
        >
          Use suggestions
        </Button>
        <Button type="button" variant="ghost" className="h-9" disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
