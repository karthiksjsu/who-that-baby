"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/admin/dashboard", label: "Babies" },
  { href: "/admin/leaderboard", label: "Leaderboard" },
  { href: "/admin/share", label: "Share / QR" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  }

  return (
    <nav className="flex w-full flex-wrap items-center justify-between gap-3 border-b border-border bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-center gap-1">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              pathname === link.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        Log out
      </Button>
    </nav>
  );
}
