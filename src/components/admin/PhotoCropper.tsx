"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * The frame players see. Cards are square in the game, so that is what the
 * host frames to — what they line up here is exactly what gets shown.
 */
export const CROP_ASPECT = 1;

/** Exported at a size that still looks sharp on a 3x phone screen. */
const OUTPUT_PX = 1000;

const MAX_ZOOM = 4;

interface Offset {
  x: number;
  y: number;
}

/**
 * Frames one photo to the card's shape before it is uploaded.
 *
 * Album photos arrive in every shape there is, and the game has one card, so
 * something has to give. Deciding that at display time means either cropping
 * blind — which is how you get a picture of somebody's dress with the face
 * out of frame — or fitting the whole thing and living with the leftovers.
 * Neither is as good as the host, who can see the photo, spending two seconds
 * saying which part of it is the baby.
 *
 * It opens on a suggestion: centred, zoomed just enough to fill the frame,
 * which is right often enough to be worth accepting blind. Drag to move it,
 * pull the slider to zoom. The crop is applied with a canvas here rather than
 * stored as coordinates, so the file that lands in the bucket is the picture
 * everyone sees — nothing downstream has to know the framing rules.
 */
export function PhotoCropper({
  src,
  busy,
  confirmLabel = "Use this framing",
  onCancel,
  onCropped,
  onUnavailable,
}: {
  /** Object URL for a local file, or the public URL of an uploaded photo. */
  src: string;
  busy?: boolean;
  confirmLabel?: string;
  onCancel: () => void;
  onCropped: (file: File) => void;
  /**
   * The photo could not be loaded for cropping — an image format the browser
   * will not decode, or a host that will not serve it to a canvas. The caller
   * decides what to do about it; uploading it unframed is usually better than
   * refusing the photo.
   */
  onUnavailable?: () => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; from: Offset } | null>(
    null
  );

  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [frameW, setFrameW] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [failed, setFailed] = useState(false);
  const [working, setWorking] = useState(false);

  const frameH = frameW / CROP_ASPECT;

  // Held in a ref rather than depended on, so a parent re-render can't restart
  // the load and throw away the framing in progress.
  const onUnavailableRef = useRef(onUnavailable);
  useEffect(() => {
    onUnavailableRef.current = onUnavailable;
  }, [onUnavailable]);

  // `crossOrigin` has to be set before `src` or the canvas is tainted later,
  // which rules out an <img> tag with a src attribute — hence loading by hand.
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    let cancelled = false;
    img.onload = () => {
      if (cancelled) return;
      imageRef.current = img;
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setFailed(false);
    };
    img.onerror = () => {
      if (cancelled) return;
      setFailed(true);
      onUnavailableRef.current?.();
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () => setFrameW(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /** Display pixels per source pixel at zoom 1: just enough to fill the frame. */
  const baseScale =
    natural && frameW ? Math.max(frameW / natural.w, frameH / natural.h) : 1;
  const scale = baseScale * zoom;
  const shownW = natural ? natural.w * scale : 0;
  const shownH = natural ? natural.h * scale : 0;

  /** Keeps the frame covered — you can move the photo, not past its edges. */
  const clamp = useCallback(
    (next: Offset): Offset => ({
      x: Math.min(0, Math.max(frameW - shownW, next.x)),
      y: Math.min(0, Math.max(frameH - shownH, next.y)),
    }),
    [frameW, frameH, shownW, shownH]
  );

  // Zooming out can leave the photo short of an edge; pull it back in.
  useEffect(() => {
    setOffset((prev) => {
      const next = clamp(prev);
      return next.x === prev.x && next.y === prev.y ? prev : next;
    });
  }, [clamp]);

  /** Centre the suggestion once the image and the frame have both measured. */
  useEffect(() => {
    if (!natural || !frameW) return;
    setOffset({ x: (frameW - natural.w * baseScale) / 2, y: (frameH - natural.h * baseScale) / 2 });
  }, [natural, frameW, frameH, baseScale]);

  function handlePointerDown(e: React.PointerEvent) {
    if (!natural) return;
    dragRef.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, from: offset };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    setOffset(
      clamp({
        x: drag.from.x + (e.clientX - drag.startX),
        y: drag.from.y + (e.clientY - drag.startY),
      })
    );
  }

  function endDrag(e: React.PointerEvent) {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
  }

  async function handleConfirm() {
    const img = imageRef.current;
    if (!img || !frameW) return;
    setWorking(true);
    try {
      // The frame maps straight back onto the source: its top-left sits at
      // -offset display pixels, and one display pixel is 1/scale source ones.
      const sx = -offset.x / scale;
      const sy = -offset.y / scale;
      const sw = frameW / scale;
      const sh = frameH / scale;

      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_PX;
      canvas.height = Math.round(OUTPUT_PX / CROP_ASPECT);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no canvas");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9)
      );
      if (!blob) throw new Error("no blob");
      onCropped(new File([blob], "photo.jpg", { type: "image/jpeg" }));
    } finally {
      setWorking(false);
    }
  }

  if (failed) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/40 p-4">
        <p className="text-sm text-muted-foreground">
          Couldn&apos;t load that photo for framing. It can still be used as it is.
        </p>
        <Button type="button" variant="outline" onClick={onCancel} className="h-9">
          Close
        </Button>
      </div>
    );
  }

  const disabled = busy || working || !natural;

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={frameRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="relative w-full touch-none overflow-hidden rounded-2xl bg-muted select-none"
        style={{ aspectRatio: String(CROP_ASPECT), cursor: natural ? "grab" : "default" }}
      >
        {natural && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            draggable={false}
            className="absolute origin-top-left max-w-none"
            style={{
              width: shownW,
              height: shownH,
              transform: `translate(${offset.x}px, ${offset.y}px)`,
            }}
          />
        )}
        {/* Thirds, to line a face up against. */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-y-0 left-1/3 w-px bg-white/40" />
          <div className="absolute inset-y-0 left-2/3 w-px bg-white/40" />
          <div className="absolute inset-x-0 top-1/3 h-px bg-white/40" />
          <div className="absolute inset-x-0 top-2/3 h-px bg-white/40" />
        </div>
      </div>

      <label className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="shrink-0">Zoom</span>
        <input
          type="range"
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="h-2 w-full accent-primary"
          aria-label="Zoom"
        />
      </label>

      <p className="text-xs text-muted-foreground">
        Drag the photo to move it. Whatever is inside the square is what players see.
      </p>

      <div className="flex gap-2">
        <Button type="button" onClick={handleConfirm} disabled={disabled} className="h-10 flex-1">
          {working ? "Framing…" : confirmLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={busy || working}
          className="h-10"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
