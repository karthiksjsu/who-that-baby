import { NextResponse } from "next/server";
import { apiRoute } from "@/lib/api/handler";
import { createBaby, listBabies } from "@/lib/db/babies";
import { supabaseAdmin } from "@/lib/supabase/server";

export const GET = apiRoute(async () => {
  const babies = await listBabies();
  return NextResponse.json({ babies });
});

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);

export const POST = apiRoute(async (request) => {
  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const file = form.get("photo");
  const correctName = String(form.get("correct_name") ?? "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing photo file." }, { status: 400 });
  }
  if (!correctName) {
    return NextResponse.json({ error: "Missing correct_name." }, { status: 400 });
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return NextResponse.json({ error: "Photo is too large (max 8MB)." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Unsupported image type." }, { status: 400 });
  }

  const client = supabaseAdmin();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await client.storage
    .from("baby-photos")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrl } = client.storage.from("baby-photos").getPublicUrl(path);

  const existing = await listBabies();
  const nextOrder = existing.length
    ? Math.max(...existing.map((b) => b.display_order)) + 1
    : 0;

  const baby = await createBaby({
    photo_url: publicUrl.publicUrl,
    correct_name: correctName,
    display_order: nextOrder,
  });

  return NextResponse.json({ baby }, { status: 201 });
});
