"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Baby } from "@/types/db";

export function BabyForm({ onCreated }: { onCreated: (baby: Baby) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  function handleFileChange() {
    const file = fileRef.current?.files?.[0];
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file || !name.trim()) return;

    setLoading(true);
    try {
      const form = new FormData();
      form.set("photo", file);
      form.set("correct_name", name.trim());
      const res = await fetch("/api/admin/babies", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't add that baby.");

      onCreated(data.baby as Baby);
      setName("");
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
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
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview" className="size-full object-cover" />
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
            required
          />
        </div>
      </div>

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

      <Button type="submit" disabled={loading || !name.trim()} className="h-11">
        {loading ? "Uploading…" : "Add baby"}
      </Button>
    </form>
  );
}
