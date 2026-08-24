import { AdminNav } from "@/components/admin/AdminNav";
import { DashboardClient } from "@/components/admin/DashboardClient";
import { listBabies } from "@/lib/db/babies";
import { getGameSettings } from "@/lib/db/settings";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [babies, settings] = await Promise.all([listBabies(), getGameSettings()]);

  return (
    <main className="min-h-screen bg-muted/40">
      <AdminNav />
      <DashboardClient initialBabies={babies} initialSettings={settings} />
    </main>
  );
}
