import { WinnerReveal } from "@/components/winner/WinnerReveal";
import { PartyBackdrop } from "@/components/shared/PartyBackdrop";

export default function WinnerPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-party-gradient px-4 py-12">
      <PartyBackdrop />
      <div className="relative z-10 w-full">
        <WinnerReveal />
      </div>
    </main>
  );
}
