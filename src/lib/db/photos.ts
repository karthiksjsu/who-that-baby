import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";

export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};

/**
 * Puts one image in the photo bucket and hands back its public URL.
 *
 * The extension comes from the content type rather than the uploaded
 * filename: cropped photos are posted as a canvas blob, which arrives named
 * whatever the browser felt like, and the bucket serves by extension.
 */
export async function uploadPhoto(
  file: File
): Promise<{ url: string } | { error: string; status: number }> {
  if (!ALLOWED_TYPES.has(file.type)) {
    return { error: "Unsupported image type.", status: 400 };
  }

  const client = supabaseAdmin();
  const path = `${crypto.randomUUID()}.${EXTENSIONS[file.type] ?? "jpg"}`;

  const { error } = await client.storage
    .from("baby-photos")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { error: error.message, status: 500 };

  const { data } = client.storage.from("baby-photos").getPublicUrl(path);
  return { url: data.publicUrl };
}
