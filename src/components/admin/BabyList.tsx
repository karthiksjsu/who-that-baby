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
  SpellCheck,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { PhotoCropper } from "@/components/admin/PhotoCropper";
import { buildChoices } from "@/lib/game/distractors";
import { normalize, suggestAliases } from "@/lib/game/aliases";
import type { Baby } from "@/types/db";

export function BabyList({
  babies,
  emptyLabel,
  moveLabel,
  showClue,
  showOptions,
  showAliases,
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
  /**
   * Only the walk round has answers to loosen — the choice round can only
   * submit a name it already displayed.
   */
  showAliases?: boolean;
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
  const [panel, setPanel] = useState<{
    id: string;
    kind: "frame" | "options" | "aliases";
  } | null>(null);

  function togglePanel(id: string, kind: "frame" | "options" | "aliases") {
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

  async function saveAliases(baby: Baby, aliases: string[] | null) {
    setBusyId(baby.id);
    try {
      const res = await fetch(`/api/admin/babies/${baby.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aliases }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save those answers.");
      onChange(babies.map((b) => (b.id === baby.id ? (data.baby as Baby) : b)));
      setPanel(null);
      toast.success(aliases ? "Accepted answers saved." : "Exact name only.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save those answers.");
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
                {showAliases && baby.aliases?.length ? (
                  <span className="truncate text-xs text-muted-foreground">
                    Also accepts: {baby.aliases.join(", ")}
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
                  {showAliases && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      title="Accepted answers"
                      onClick={() => togglePanel(baby.id, "aliases")}
                    >
                      <SpellCheck className="size-4" />
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

          {panel?.id === baby.id && panel.kind === "aliases" && (
            <AnswersEditor
              baby={baby}
              allNames={allNames}
              busy={busyId === baby.id}
              onCancel={() => setPanel(null)}
              onSave={(aliases) => saveAliases(baby, aliases)}
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

  /*
   * Selection, not ordering. The server shuffles the options into a fresh
   * order for every player, so any effort the host spends arranging them is
   * thrown away — which is why this is a set of toggles rather than slots to
   * drag names into. Tapping also survives being done one-handed on a phone
   * at the party, which dragging does not.
   */
  const [picked, setPicked] = useState<string[]>(
    () => baby.distractors ?? suggested.slice(0, slots)
  );
  const [typed, setTyped] = useState("");

  /** Uploaded names, minus this card's answer, plus any pinned write-ins. */
  const pool = Array.from(
    new Set([...allNames.filter((n) => n !== baby.correct_name), ...picked])
  );
  const full = picked.length >= slots;

  function toggle(name: string) {
    setPicked((prev) =>
      prev.includes(name)
        ? prev.filter((n) => n !== name)
        : prev.length < slots
          ? [...prev, name]
          : prev
    );
  }

  function addTyped() {
    const name = typed.trim();
    if (!name || full || picked.includes(name) || name === baby.correct_name) return;
    setPicked((prev) => [...prev, name]);
    setTyped("");
  }

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium">
          Options for this photo
          {baby.distractors?.length ? "" : " (suggested)"}
        </p>
        <p className="shrink-0 text-xs text-muted-foreground">
          {picked.length} of {slots} picked
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        <Check className="size-4 shrink-0" />
        <span className="truncate">{baby.correct_name}</span>
        <span className="ml-auto shrink-0 text-xs">the answer</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {pool.map((name) => {
          const on = picked.includes(name);
          return (
            <button
              key={name}
              type="button"
              aria-pressed={on}
              /* A full set greys out what is not already chosen rather than
                 silently ignoring the tap. */
              disabled={busy || (full && !on)}
              onClick={() => toggle(name)}
              className={
                on
                  ? "flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                  : "flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground disabled:opacity-40"
              }
            >
              {on && <Check className="size-3.5 shrink-0" aria-hidden />}
              <span className="max-w-40 truncate">{name}</span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Input
          value={typed}
          maxLength={80}
          placeholder={full ? "All slots filled" : "Or type a name"}
          disabled={busy || full}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTyped();
            }
          }}
          className="h-9"
        />
        <Button
          type="button"
          variant="outline"
          className="h-9 shrink-0"
          disabled={busy || full || !typed.trim()}
          onClick={addTyped}
        >
          Add
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Tap {slots} wrong answers. They are shuffled with the real one for every player, so the
        order here does not matter.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="h-9"
          disabled={busy || picked.length < slots}
          onClick={() => onSave(picked)}
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

/**
 * Chooses what else counts as this person's name in the walk round.
 *
 * The exact name always wins and is shown here as fixed, so the host is only
 * ever adding leniency, never able to remove the answer from its own card.
 * Suggestions are withheld rather than offered when a shortening would also
 * answer somebody else's photo — and the reason is shown, because a panel
 * that silently offers nothing looks broken rather than careful.
 */
function AnswersEditor({
  baby,
  allNames,
  busy,
  onCancel,
  onSave,
}: {
  baby: Baby;
  allNames: string[];
  busy: boolean;
  onCancel: () => void;
  onSave: (aliases: string[] | null) => void;
}) {
  const { suggested, withheld } = suggestAliases(baby.correct_name, allNames);
  const [accepted, setAccepted] = useState<string[]>(() => baby.aliases ?? suggested);
  const [typed, setTyped] = useState("");

  /* Offered but not yet taken — so a removed suggestion can be put back. */
  const available = suggested.filter(
    (s) => !accepted.some((a) => normalize(a) === normalize(s))
  );

  function add(name: string) {
    const clean = name.trim();
    if (!clean) return;
    if (normalize(clean) === normalize(baby.correct_name)) return;
    if (accepted.some((a) => normalize(a) === normalize(clean))) return;
    setAccepted((prev) => [...prev, clean]);
  }

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
      <p className="text-sm font-medium">Accepted answers</p>

      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        <Check className="size-4 shrink-0" />
        <span className="truncate">{baby.correct_name}</span>
        <span className="ml-auto shrink-0 text-xs">always correct</span>
      </div>

      {accepted.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {accepted.map((name) => (
            <button
              key={name}
              type="button"
              disabled={busy}
              title="Remove"
              onClick={() =>
                setAccepted((prev) => prev.filter((n) => n !== name))
              }
              className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
            >
              <span className="max-w-40 truncate">{name}</span>
              <X className="size-3.5 shrink-0" aria-hidden />
            </button>
          ))}
        </div>
      )}

      {available.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Suggested:</span>
          {available.map((name) => (
            <button
              key={name}
              type="button"
              disabled={busy}
              onClick={() => add(name)}
              className="rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground"
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {withheld.map(({ alias, collidesWith }) => (
        <p
          key={alias}
          className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900"
        >
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Not suggesting <strong>{alias}</strong> — it would also answer{" "}
            {collidesWith.join(" and ")}. Add it below only if you want that guess to
            count here too.
          </span>
        </p>
      ))}

      <div className="flex gap-2">
        <Input
          value={typed}
          maxLength={80}
          placeholder="Another spelling or nickname"
          disabled={busy}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(typed);
              setTyped("");
            }
          }}
          className="h-9"
        />
        <Button
          type="button"
          variant="outline"
          className="h-9 shrink-0"
          disabled={busy || !typed.trim()}
          onClick={() => {
            add(typed);
            setTyped("");
          }}
        >
          Add
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Capital letters and extra spaces are already ignored, so there is no need to add
        those.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="h-9"
          disabled={busy}
          onClick={() => onSave(accepted.length ? accepted : null)}
        >
          {busy ? "Saving…" : "Save answers"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-9"
          disabled={busy || !baby.aliases?.length}
          onClick={() => onSave(null)}
        >
          Exact name only
        </Button>
        <Button type="button" variant="ghost" className="h-9" disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
