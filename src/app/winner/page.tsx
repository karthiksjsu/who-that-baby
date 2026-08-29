import { WinnerReveal } from "@/components/winner/WinnerReveal";
import { PartyBackdrop } from "@/components/shared/PartyBackdrop";

export default function WinnerPage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-x-clip bg-party-gradient px-4 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-12">
      <PartyBackdrop />
      <div className="relative z-10 w-full">
        <WinnerReveal />
      </div>
    </main>
  );
}
