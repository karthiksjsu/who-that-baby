import { AdminNav } from "@/components/admin/AdminNav";
import { AdminLeaderboardClient } from "@/components/admin/AdminLeaderboardClient";
import { getGameSettings } from "@/lib/db/settings";

export const dynamic = "force-dynamic";

export default async function AdminLeaderboardPage() {
  const settings = await getGameSettings();

  return (
    <main className="min-h-screen bg-muted/40">
      <AdminNav />
      <AdminLeaderboardClient initialWinnerRevealed={settings.winner_revealed} />
    </main>
  );
}
