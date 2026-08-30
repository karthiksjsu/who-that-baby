import { NextResponse } from "next/server";
import { apiRoute } from "@/lib/api/handler";
import { updateBaby } from "@/lib/db/babies";
import { MAX_PHOTO_BYTES, uploadPhoto } from "@/lib/db/photos";

/**
 * Replaces one baby's photo, which is how re-framing is saved: the admin
 * crops in the browser and posts the result here.
 *
 * The new file is uploaded under a fresh key rather than overwriting the old
 * one. A game can be live while the host tidies up, and players' phones are
 * holding the old URL — overwriting in place would leave them on a cached
 * image with no way to tell it had changed.
 */
export const POST = apiRoute(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const form = await request.formData().catch(() => null);
    const file = form?.get("photo");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing photo file." }, { status: 400 });
    }
    if (file.size > MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: "Photo is too large (max 8MB)." }, { status: 400 });
    }

    const uploaded = await uploadPhoto(file);
    if ("error" in uploaded) {
      return NextResponse.json({ error: uploaded.error }, { status: uploaded.status });
    }

    const baby = await updateBaby(id, { photo_url: uploaded.url });
    return NextResponse.json({ baby });
  }
);
