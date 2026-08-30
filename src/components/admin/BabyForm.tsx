"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PhotoCropper } from "@/components/admin/PhotoCropper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Baby, GameRound } from "@/types/db";

export function BabyForm({
  round,
  onCreated,
}: {
  round: GameRound;
  onCreated: (baby: Baby) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  /** The photo as picked, shown in the cropper until it is framed. */
  const [rawUrl, setRawUrl] = useState<string | null>(null);
  const [framed, setFramed] = useState<{ file: File; url: string } | null>(null);
  /** Set when the browser can't decode the photo — HEIC outside Safari, say. */
  const [unframeable, setUnframeable] = useState(false);
  const [name, setName] = useState("");
  const [clue, setClue] = useState("");
  const [loading, setLoading] = useState(false);

  // Object URLs outlive the render that made them, so let them go by hand.
  useEffect(() => () => {
    if (rawUrl) URL.revokeObjectURL(rawUrl);
  }, [rawUrl]);
  useEffect(() => () => {
    if (framed) URL.revokeObjectURL(framed.url);
  }, [framed]);

  function handleFileChange() {
    const file = fileRef.current?.files?.[0];
    setFramed(null);
    setUnframeable(false);
    setRawUrl(file ? URL.createObjectURL(file) : null);
  }

  function clearPhoto() {
    setRawUrl(null);
    setFramed(null);
    setUnframeable(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // The framed copy is what gets uploaded; the original is only ever the
    // fallback for a photo the browser could not load into a canvas.
    const file = framed?.file ?? fileRef.current?.files?.[0];
    if (!file || !name.trim()) return;

    setLoading(true);
    try {
      const form = new FormData();
      form.set("photo", file);
      form.set("correct_name", name.trim());
      form.set("round", round);
      if (round === "bonus" && clue.trim()) form.set("clue", clue.trim());
      const res = await fetch("/api/admin/babies", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't add that baby.");

      onCreated(data.baby as Baby);
      setName("");
      setClue("");
      clearPhoto();
      toast.success("Baby added!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5"
    >
      <h2 className="font-display text-lg font-bold">Add a baby photo</h2>

      <div className="flex items-center gap-4">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
          {framed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={framed.url} alt="Framed preview" className="size-full object-cover" />
          ) : (
            <span className="text-2xl">👶</span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="photo">Photo</Label>
          <Input
            id="photo"
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            required={!framed}
          />
        </div>
      </div>

      {/* Framing comes straight after picking the file, while the photo is
          still the thing being thought about. */}
      {rawUrl && !framed && (
        <PhotoCropper
          src={rawUrl}
          onCancel={clearPhoto}
          onCropped={(file) => setFramed({ file, url: URL.createObjectURL(file) })}
          onUnavailable={() => setUnframeable(true)}
        />
      )}

      {framed && (
        <button
          type="button"
          onClick={() => setFramed(null)}
          className="self-start text-sm font-medium text-primary hover:underline"
        >
          Reframe photo
        </button>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="correct_name">Who is this baby, all grown up?</Label>
        <Input
          id="correct_name"
          placeholder="e.g. Priya Sharma"
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      {round === "bonus" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="clue">Clue for players (optional)</Label>
          <Input
            id="clue"
            placeholder="e.g. Loves dinosaurs 🦖"
            value={clue}
            maxLength={140}
            onChange={(e) => setClue(e.target.value)}
          />
        </div>
      )}

      <Button
        type="submit"
        disabled={loading || !name.trim() || (!!rawUrl && !framed && !unframeable)}
        className="h-11"
      >
        {loading ? "Uploading…" : "Add baby"}
      </Button>
    </form>
  );
}
