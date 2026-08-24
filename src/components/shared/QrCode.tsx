"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function QrCode({ url, size = 320 }: { url: string; size?: number }) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  function handleDownload() {
    const canvas = wrapperRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "whos-that-baby-qr.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={wrapperRef}
        className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-border print:shadow-none"
      >
        <QRCodeCanvas value={url} size={size} level="M" marginSize={0} />
      </div>
      <p className="break-all text-center text-sm text-muted-foreground">{url}</p>
      <Button onClick={handleDownload} variant="secondary" className="print:hidden">
        <Download className="size-4" />
        Download PNG
      </Button>
    </div>
  );
}
