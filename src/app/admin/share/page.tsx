import { AdminNav } from "@/components/admin/AdminNav";
import { QrCode } from "@/components/shared/QrCode";

export default function AdminSharePage() {
  const url = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <main className="min-h-screen bg-muted/40">
      <div className="print:hidden">
        <AdminNav />
      </div>
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 px-4 py-12 text-center">
        <div className="flex flex-col items-center gap-1">
          <span className="text-4xl">🍼</span>
          <h1 className="font-display text-2xl font-bold">Scan to play!</h1>
          <p className="text-sm text-muted-foreground">
            Show this on a projector, or print it out for the party.
          </p>
        </div>
        <QrCode url={url} size={340} />
      </div>
    </main>
  );
}
